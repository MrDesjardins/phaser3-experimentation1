import Phaser from "phaser";
import { configuration } from "./config";
import { Demo1 } from "./scenes/demo1";
import { Demo2 } from "./scenes/demo2";

new Phaser.Game(
  Object.assign(configuration, {
    scene: [Demo1],
  })
);
