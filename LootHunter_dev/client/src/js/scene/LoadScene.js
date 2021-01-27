import {CST} from "../CST";
import Phaser from "phaser";

class LoadScene extends Phaser.Scene {
    constructor(){
        super({
            key: CST.SCENES.LOAD
        })
    }

    init() {
        console.log("@Load Scene");
    }

    preload() {
        // Load every image, audio, spritesheet for the game
        this.loadAssets(["IMAGE", "AUDIO", "SPRITE"]);
        
        // Loading bar
        let loadingBar = this.add.graphics({
            fillStyle: {
                color: 0xffffff //white
            }
        })

        // Loading bar events
        this.load.on("progress", (percent)=>{
            loadingBar.fillRect(0, this.game.renderer.height / 2, this.game.renderer.width * percent, 50);
        })

        this.load.on("complete", ()=>{
            console.log("@Preload Complete");
        })
    }

    create() {
        this.scene.start(CST.SCENES.MENU);
    }

    loadAssets(folders) {
        folders.forEach((path) => {
            this.load.setPath('../assets/' + path);
            for (let prop in CST[path]) {
                switch (path) {
                    case "IMAGE":
                        this.load.image(CST[path][prop], CST[path][prop]);
                        break;
                    case "AUDIO":
                        this.load.audio(CST[path][prop], CST[path][prop]);
                        break;
                    case "SPRITE":
                        this.load.spritesheet(CST[path][prop], CST[path][prop], {
                            frameHeight: 32,
                            frameWidth: 32
                        });
                    
                }
            }
        });
    }
}

export default LoadScene;