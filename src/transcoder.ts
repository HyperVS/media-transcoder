import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import os from 'os'
import path from 'path'
import fs from 'fs'

export class Transcoder {

    protected process: FfmpegCommand
    protected inputFile: string = ''

    private createDir(){
        try {
            fs.mkdirSync('tmp') 
        } catch (error: any) {
            if(error.code !== 'EEXIST') console.error(error)
        }

        const dir = path.join(path.resolve('tmp'), this.inputFile)
        fs.mkdirSync(dir)
        return dir;
    }

    private generateThumbnail(){
        // this.process.ffprobe()
    }

    private reset(){
        this.process = ffmpeg()
    }

    constructor(){
        this.process = ffmpeg({
            cwd: path.resolve(__dirname)
        })
        if(os.platform() === 'win32'){
            const _binaries = path.resolve('./ffmpeg/bin/')
            const _ffmpegPath = path.join(_binaries, 'ffmpeg.exe')
            const _ffprobePath = path.join(_binaries, 'ffprobe.exe')
            try {
                fs.statSync(_ffmpegPath)
            } catch (error) {
                console.error(error)
                throw error
            }
            this.process.setFfmpegPath(_ffmpegPath)
            this.process.setFfprobePath(_ffprobePath)
        }
    }
    
    encode(this: Transcoder, input: string){
        this.inputFile = input
        this.process.input(path.resolve(input))
        return this;
    }

    pipe(this: Transcoder){
        const dir = this.createDir()
        this.process.output(`${dir}/${path.parse(this.inputFile).name}.m3u8`)
            .outputOptions([
                '-r 60',
                '-preset veryfast',
                '-keyint_min 60',
                '-g 60',
                '-sc_threshold 0',
                '-profile:v main',
                '-use_template 1',
                '-use_timeline 1',
                '-b_strategy 0',
                '-bf 1',
                '-s 1920x1080',
                '-b:a 96k',
                '-f hls',
                '-start_number 0',
                '-hls_time 5',         
                '-hls_list_size 0', 
                `-threads ${os.cpus().length}`
            ]);
        return this;
    }

    exec(this: Transcoder){
        this.process.on('start', (cmd) => {
            console.log("progress,", "Started ffmpeg with command: " + cmd)
        })
            .on('progress', (info) => {
                console.log('progress', info);
        })
            .on('end', () => {
                console.log('complete')
        })
            .on('error', (error) => {
                console.error(error)
            })
        this.process.run()
        return;
    }

}

let T = new Transcoder()
    .encode('HeavingNettedCaptaincharlie.mp4')
    .pipe()
    .exec()
