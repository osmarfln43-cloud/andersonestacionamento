import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Props {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
}

export default function BarcodeSvg({ value, width = 1.6, height = 50, fontSize = 16, displayValue = true, className }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128B",
        width,
        height,
        displayValue,
        fontSize,
        fontOptions: "bold",
        textMargin: 1,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      /* ignore invalid values */
    }
  }, [value, width, height, fontSize, displayValue]);

  if (!value) return null;
  return <svg ref={ref} className={className} />;
}
