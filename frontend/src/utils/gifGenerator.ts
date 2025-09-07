// @ts-ignore
import GIF from 'gif.js';

export interface ImageData {
  before: string; // base64 data URL
  after: string;  // base64 data URL
  width?: number;
  height?: number;
}

export class GIFGenerator {
  private gif: any;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number = 512, height: number = 512) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.gif = new GIF({
      workers: 2,
      quality: 10,
      width: width,
      height: height,
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private addTextOverlay(text: string, position: 'top' | 'bottom' = 'bottom') {
    this.ctx.save();
    
    // Text styling
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.textAlign = 'center';
    
    // Position calculation
    const x = this.canvas.width / 2;
    const y = position === 'top' ? 30 : this.canvas.height - 20;
    
    // Draw text with outline
    this.ctx.strokeText(text, x, y);
    this.ctx.fillText(text, x, y);
    
    this.ctx.restore();
  }

  public async generateChangeGIF(imageData: ImageData): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load images
        const beforeImg = await this.loadImage(imageData.before);
        const afterImg = await this.loadImage(imageData.after);
        
        // Frame 1: Before image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(beforeImg, 0, 0, this.canvas.width, this.canvas.height);
        this.addTextOverlay('BEFORE', 'bottom');
        this.gif.addFrame(this.canvas, { delay: 1500 });
        
        // Frame 2: After image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(afterImg, 0, 0, this.canvas.width, this.canvas.height);
        this.addTextOverlay('AFTER', 'bottom');
        this.gif.addFrame(this.canvas, { delay: 1500 });
        
        // Generate GIF
        this.gif.on('finished', (blob: Blob) => {
          resolve(blob);
        });
        
        this.gif.on('abort', () => {
          reject(new Error('GIF generation aborted'));
        });
        
        this.gif.render();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  public async generateNDVIDiffGIF(
    beforeImage: string,
    afterImage: string,
    ndviDiff: number[][]
  ): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load images
        const beforeImg = await this.loadImage(beforeImage);
        const afterImg = await this.loadImage(afterImage);
        
        // Frame 1: Before
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(beforeImg, 0, 0, this.canvas.width, this.canvas.height);
        this.addTextOverlay('BEFORE', 'bottom');
        this.gif.addFrame(this.canvas, { delay: 1000 });
        
        // Frame 2: After
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(afterImg, 0, 0, this.canvas.width, this.canvas.height);
        this.addTextOverlay('AFTER', 'bottom');
        this.gif.addFrame(this.canvas, { delay: 1000 });
        
        // Frame 3: NDVI Difference visualization
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderNDVIDiff(ndviDiff);
        this.addTextOverlay('CHANGE DETECTION', 'bottom');
        this.gif.addFrame(this.canvas, { delay: 2000 });
        
        this.gif.on('finished', (blob: Blob) => {
          resolve(blob);
        });
        
        this.gif.render();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private renderNDVIDiff(ndviDiff: number[][]) {
    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    const rows = ndviDiff.length;
    const cols = ndviDiff[0].length;
    
    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const row = Math.floor((y / this.canvas.height) * rows);
        const col = Math.floor((x / this.canvas.width) * cols);
        
        const diff = ndviDiff[row]?.[col] || 0;
        const index = (y * this.canvas.width + x) * 4;
        
        // Color mapping for NDVI difference
        if (diff < -0.15) {
          // Red for vegetation loss (construction/trash)
          data[index] = 255;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 200;
        } else if (diff > 0.20) {
          // Blue for vegetation gain (algal bloom)
          data[index] = 0;
          data[index + 1] = 100;
          data[index + 2] = 255;
          data[index + 3] = 200;
        } else {
          // Transparent for no significant change
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  public dispose() {
    if (this.gif) {
      this.gif.abort();
    }
  }
}

// Utility function to convert blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Utility function to detect changes in satellite imagery
export function detectEnvironmentalChanges(
  beforeImageData: ImageData,
  afterImageData: ImageData
): {
  changeType: 'trash' | 'algal_bloom' | 'construction';
  confidence: number;
  affectedArea: number;
} {
  // This is a simplified version - the real implementation would use WebGL shaders
  // For MVP, we'll return mock data
  const changeTypes = ['trash', 'algal_bloom', 'construction'] as const;
  const randomType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
  
  return {
    changeType: randomType,
    confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
    affectedArea: Math.random() * 0.1 + 0.05, // 5-15% of area
  };
}
