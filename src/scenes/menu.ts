import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  private stars: Phaser.Physics.Arcade.Group | undefined;
  private bombs: Phaser.Physics.Arcade.Group | undefined;
  private platforms: Phaser.Physics.Arcade.StaticGroup | undefined;
  constructor() {
    super("GameScene");
  }
  private keyA: Phaser.Input.Keyboard.Key | undefined;
  private keyS: Phaser.Input.Keyboard.Key | undefined;
  private keyD: Phaser.Input.Keyboard.Key | undefined;
  private keyW: Phaser.Input.Keyboard.Key | undefined;
  private score: number = 0;
  private scoreText: Phaser.GameObjects.Text | undefined;
  private gameOver: boolean = false;
  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.add.image(400, 300, "sky");
    this.platforms = this.createGrounds();
    this.player = this.createPlayer(this.platforms);
    this.bombs = this.createBombs(this.player, this.platforms);
    this.stars = this.createStarts(this.player, this.bombs, this.platforms);
    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      color: "#000",
    });
    this.attachKeyboardEvents();
  }

  private createGrounds(): Phaser.Physics.Arcade.StaticGroup {
    const platforms: Phaser.Physics.Arcade.StaticGroup =
      this.physics.add.staticGroup();

    platforms.create(400, 568, "ground").setScale(2).refreshBody();
    platforms.create(600, 400, "ground");
    platforms.create(50, 250, "ground");
    platforms.create(750, 220, "ground");
    return platforms;
  }
  private createPlayer(
    platforms: Phaser.Physics.Arcade.StaticGroup
  ): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    const player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody =
      this.physics.add.sprite(100, 450, "dude");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(30);
    this.physics.add.collider(player, platforms);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
    return player;
  }
  private attachKeyboardEvents() {
    if (this.input.keyboard) {
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    }
  }
  private createStarts(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    bombs: Phaser.Physics.Arcade.Group,
    platforms: Phaser.Physics.Arcade.StaticGroup
  ): Phaser.Physics.Arcade.Group {
    const stars: Phaser.Physics.Arcade.Group = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.Physics.Arcade.Body) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      }
      return true;
    });

    // Player and start will call a function "collectStar" when they overlap
    this.physics.add.overlap(
      player,
      stars,
      (p, s) => this.collectStar(p, s, stars, bombs),
      undefined,
      this
    );

    // To make the starts not fall through the ground
    this.physics.add.collider(stars, platforms);
    return stars;
  }

  private createBombs(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    platforms: Phaser.Physics.Arcade.StaticGroup
  ): Phaser.Physics.Arcade.Group {
    const bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, this.hitBomb, undefined, this);
    return bombs;
  }

  update() {
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors && this.player) {
      // Left and Right
      if (cursors.left.isDown || this.keyA?.isDown) {
        this.player.setVelocityX(-160);
        this.player.anims.play("left", true);
      } else if (cursors.right.isDown || this.keyD?.isDown) {
        this.player.setVelocityX(160);
        this.player.anims.play("right", true);
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play("turn");
      }

      // Jump
      if (
        (cursors.up.isDown || this.keyW?.isDown) &&
        this.player.body.touching.down
      ) {
        this.player.setVelocityY(-300);
      }

      // Down
      if (
        (cursors.down.isDown || this.keyS?.isDown) &&
        !this.player.body.touching.down
      ) {
        this.player.setVelocityY(+100);
      }
    }
  }

  collectStar(
    player:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile,
    star: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    stars: Phaser.Physics.Arcade.Group,
    bombs: Phaser.Physics.Arcade.Group
  ): void {
    if (star instanceof Phaser.Physics.Arcade.Sprite) {
      star.disableBody(true, true);
      this.score += 10;
      if (this.scoreText) {
        this.scoreText.setText("Score: " + this.score);
      }
    }

    if (stars.countActive(true) === 0) {
      stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
        if (child instanceof Phaser.Physics.Arcade.Image) {
          child.enableBody(true, child.x, 0, true, true);
        }
        return true;
      });

      const player = this
        .player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

      const x =
        player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      var bomb = bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }

  hitBomb(
    player:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile,
    bomb: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    this.physics.pause();
    if (player instanceof Phaser.Physics.Arcade.Image) {
      player.setTint(0xff0000);
    }
    if (player instanceof Phaser.Physics.Arcade.Sprite) {
      player.anims.play("turn");
    }
    this.gameOver = true;
  }
}
