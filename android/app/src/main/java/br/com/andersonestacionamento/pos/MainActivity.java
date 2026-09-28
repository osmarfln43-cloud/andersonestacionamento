package br.com.andersonestacionamento.pos;

import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.os.RemoteException;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ValueCallback;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import com.sunmi.peripheral.printer.InnerPrinterCallback;
import com.sunmi.peripheral.printer.InnerPrinterException;
import com.sunmi.peripheral.printer.InnerPrinterManager;
import com.sunmi.peripheral.printer.InnerResultCallback;
import com.sunmi.peripheral.printer.SunmiPrinterService;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String HOME = "https://appassets.androidplatform.net/assets/index.html";
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private SunmiPrinterService printer;
    private byte[] pendingPdf;
    private String pendingPdfName;
    private final InnerPrinterCallback printerConnection = new InnerPrinterCallback() {
        @Override protected void onConnected(SunmiPrinterService service) { printer = service; }
        @Override protected void onDisconnected() { printer = null; }
    };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xff163b28);
        getWindow().setNavigationBarColor(0xff163b28);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                fileCallback = callback;
                try { startActivityForResult(params.createIntent(), 71); return true; }
                catch (Exception e) { fileCallback = null; callback.onReceiveValue(null); return false; }
            }
            @Override public void onPermissionRequest(PermissionRequest request) {
                if (request.getOrigin().toString().startsWith("https://appassets.androidplatform.net"))
                    runOnUiThread(() -> {
                        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
                            request.grant(request.getResources());
                        else { request.deny(); requestPermissions(new String[]{Manifest.permission.CAMERA}, 72); }
                    });
                else request.deny();
            }
        });
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface public void printTicket(String payload) {
                if (!HOME.equals(webView.getUrl().split("#")[0])) return;
                runOnUiThread(() -> printReceipt(payload));
            }
            @JavascriptInterface public void savePdf(String name, String base64) {
                runOnUiThread(() -> {
                    if (!HOME.equals(webView.getUrl().split("#")[0])) return;
                    try {
                        if (base64.length() > 20_000_000) throw new IllegalArgumentException("PDF muito grande");
                        byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                        if (bytes.length < 5 || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F')
                            throw new IllegalArgumentException("Arquivo PDF inválido");
                        String safeName = name.matches("[a-zA-Z0-9_.-]+\\.pdf") ? name : "relatorio-anderson.pdf";
                        if (Build.VERSION.SDK_INT < 29 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                            pendingPdf = bytes;
                            pendingPdfName = safeName;
                            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 73);
                        } else savePdfInDownloads(safeName, bytes);
                    } catch (Exception e) { show("Falha ao preparar PDF: " + e.getMessage()); }
                });
            }
        }, "AndersonPOS");
        setContentView(webView);
        try { InnerPrinterManager.getInstance().bindService(this, printerConnection); }
        catch (InnerPrinterException e) { show("Serviço da impressora não encontrado"); }
        webView.loadUrl(HOME);
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.CAMERA}, 72);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 71 && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 73) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED && pendingPdf != null)
                savePdfInDownloads(pendingPdfName, pendingPdf);
            else show("Permissão para salvar em Downloads negada");
            pendingPdf = null;
            pendingPdfName = null;
        }
    }

    private void savePdfInDownloads(String name, byte[] bytes) {
        new Thread(() -> {
            Uri uri = null;
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Anderson Estacionamento");
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                    uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) throw new Exception("Downloads indisponível");
                    try (OutputStream stream = getContentResolver().openOutputStream(uri)) {
                        if (stream == null) throw new Exception("Não foi possível abrir o arquivo");
                        stream.write(bytes);
                    }
                    values.clear();
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    getContentResolver().update(uri, values, null, null);
                } else {
                    File folder = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Anderson Estacionamento");
                    if (!folder.exists() && !folder.mkdirs()) throw new Exception("Não foi possível criar a pasta Downloads");
                    try (OutputStream stream = new FileOutputStream(new File(folder, name))) { stream.write(bytes); }
                }
                show("PDF salvo em Downloads/Anderson Estacionamento/" + name);
            } catch (Exception e) {
                if (uri != null) getContentResolver().delete(uri, null, null);
                show("Falha ao salvar PDF: " + e.getMessage());
            }
        }).start();
    }

    private String date(String value) {
        try {
            Date parsed = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(value);
            return new SimpleDateFormat("dd/MM/yyyy HH:mm", new Locale("pt", "BR")).format(parsed);
        } catch (Exception ignored) { return value; }
    }

    private void printReceipt(String payload) {
        if (printer == null) { show("Impressora indisponível. Registro salvo; use Reimprimir."); return; }
        try {
            int status = printer.updatePrinterState();
            if (status != 1) { show("Impressora não pronta (código " + status + "). Confira papel e tampa."); return; }
            JSONObject d = new JSONObject(payload);
            String ticket = d.optString("ticketCodigo", "");
            String plate = d.optString("placa", "").toUpperCase(Locale.ROOT);
            printer.enterPrinterBuffer(true);
            printer.printText("ANDERSON ESTACIONAMENTO\n", null);
            printer.printText("--------------------------------\n", null);
            printer.printText("TICKET: " + ticket + "\nPLACA: " + plate + "\n", null);
            printer.printText("TIPO: " + ("moto".equals(d.optString("categoria")) ? "Moto" : "Carro") + "\n", null);
            printer.printText("CLIENTE: " + d.optString("tipo_cliente", "Avulso") + "\n", null);
            printer.printText("MODELO: " + d.optString("modelo", "N/I") + "\n", null);
            printer.printText("ENTRADA: " + date(d.optString("entrada", "")) + "\n", null);
            if (d.has("saida")) {
                printer.printText("SAÍDA: " + date(d.optString("saida", "")) + "\n", null);
                printer.printText("TEMPO: " + d.optString("tempoTotal", "") + "\n", null);
                printer.printText("TOTAL: R$ " + d.optString("valorTotal", "0") + "\n", null);
                printer.printText("PAGAMENTO: " + d.optString("formaPagamento", "") + "\n", null);
            }
            if (!ticket.isEmpty()) printer.printBarCode(ticket, 8, 80, 2, 2, null);
            printer.printText("\nGuarde este comprovante.\n\n\n", null);
            printer.exitPrinterBufferWithCallback(true, new InnerResultCallback() {
                @Override public void onRunResult(boolean ok) throws RemoteException { }
                @Override public void onReturnString(String result) throws RemoteException { }
                @Override public void onRaiseException(int code, String message) throws RemoteException { show("Falha na impressão: " + message); }
                @Override public void onPrintResult(int code, String message) throws RemoteException {
                    show(code == 0 ? "Comprovante impresso" : "Falha na impressão. Use Reimprimir.");
                }
            });
        } catch (Exception e) {
            try { printer.exitPrinterBuffer(false); } catch (Exception ignored) { }
            show("Falha na impressão. Registro preservado; use Reimprimir.");
        }
    }

    private void show(String message) { runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show()); }
    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        try { InnerPrinterManager.getInstance().unBindService(this, printerConnection); } catch (Exception ignored) { }
        webView.destroy(); super.onDestroy();
    }
}
