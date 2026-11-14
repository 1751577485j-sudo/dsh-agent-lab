import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");   // 暗部渐变多，JPEG 会产生色带
Config.setCrf(16);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
