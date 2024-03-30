import Phaser from "phaser";
import { configuration } from "./config";
import { GameScene } from "./scenes/menu";

new Phaser.Game({
  ...configuration,
  ...{
    scene: [GameScene],
  },
});
