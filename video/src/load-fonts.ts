import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * Noto Sans SC（SIL OFL 1.1）子集，只包含本片用到的字符，随工程一起提交，
 * 不依赖渲染机的系统字体。loadFont 内部用 delayRender 等待字体就绪。
 */
loadFont({
  family: "Noto Sans SC",
  url: staticFile("fonts/NotoSansSC-subset.ttf"),
  weight: "100 900",
  format: "truetype",
});
