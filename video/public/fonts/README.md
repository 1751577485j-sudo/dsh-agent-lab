# fonts

- `NotoSansSC-subset.ttf`：Noto Sans SC（可变字重 100–900）子集，只保留本片用到的字符 + 可打印 ASCII。
  - 来源：Google Noto 字体，SIL Open Font License 1.1（见 `OFL.txt`）。
  - 用 `python3 -m fontTools.subset` 生成；改文案后需重新取 `layout.json` 中所有字符并重新子集化。
  - 通过 `src/load-fonts.ts` 的 `@remotion/fonts` `loadFont()` 显式加载，不依赖渲染机系统字体。
