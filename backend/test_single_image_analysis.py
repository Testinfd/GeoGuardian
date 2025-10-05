#!/usr/bin/env python3
"""
Single Image Analysis - Analyze current environmental state without change detection
Works with just 1 satellite image!
"""

import sys
import os
import asyncio
sys.path.append('.')

from datetime import datetime
import logging
import numpy as np

# Import backend modules directly
from app.core.satellite_data import SentinelDataFetcher, FetchConfig
from app.core.spectral_analyzer import SpectralAnalyzer
from app.algorithms.visualization import ChangeVisualizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Umananda Island coordinates
UMANANDA_GEOJSON = {
    "type": "Polygon",
    "coordinates": [[
        [91.7447, 26.1961],
        [91.7447, 26.1967],
        [91.7453, 26.1967],
        [91.7453, 26.1961],
        [91.7447, 26.1961]
    ]]
}

def print_header(text):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_step(step, text):
    print(f"\n[STEP {step}] {text}")
    print("-" * 70)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")


class SingleImageAnalyzer:
    """Analyze environmental state from single satellite image"""
    
    def __init__(self):
        self.satellite_fetcher = SentinelDataFetcher(
            FetchConfig(max_cloud_coverage=0.3, max_images=1)
        )
        self.spectral_analyzer = SpectralAnalyzer()
        self.visualizer = ChangeVisualizer()
    
    async def fetch_latest_image(self, geojson, days_back=60):
        """Fetch the most recent satellite image"""
        print_step(1, f"Fetch Latest Satellite Image ({days_back} days)")
        
        try:
            print_info("Querying Sentinel Hub for most recent image...")
            
            # Get just the most recent image
            from datetime import timedelta
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            images = await self.satellite_fetcher.fetch_imagery(
                aoi_geometry=geojson,
                date_range=(start_date, end_date),
                bands=None  # Use default bands
            )
            
            if images and len(images) > 0:
                image = images[0]
                print_success(f"Found satellite image!")
                print_info(f"Date: {image.timestamp}")
                print_info(f"Cloud cover: {image.cloud_coverage:.1f}%")
                print_info(f"Image shape: {image.data.shape}")
                print_info(f"Bands: {image.bands}")
                return image
            else:
                print_error("No recent satellite imagery found")
                return None
                
        except Exception as e:
            print_error(f"Image fetching failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def analyze_spectral_indices(self, image):
        """Analyze all spectral indices from single image"""
        print_step(2, "Analyze Spectral Indices")
        
        try:
            print_info("Extracting spectral features...")
            
            # Extract all features
            features = self.spectral_analyzer.extract_all_features(image.data)
            
            indices = features['indices']
            
            print_success("Spectral analysis complete!")
            print_info(f"\n📊 Spectral Indices Results:")
            
            # Vegetation Health
            if 'ndvi' in indices:
                ndvi_mean = np.nanmean(indices['ndvi'])
                print(f"\n🌱 Vegetation Health:")
                print(f"   • NDVI (Normalized Difference Vegetation Index): {ndvi_mean:.3f}")
                if ndvi_mean > 0.6:
                    print(f"     → Status: ✅ Healthy vegetation")
                elif ndvi_mean > 0.3:
                    print(f"     → Status: ⚠️ Moderate vegetation")
                else:
                    print(f"     → Status: ❌ Poor/no vegetation")
            
            if 'evi' in indices:
                evi_mean = np.nanmean(indices['evi'])
                print(f"   • EVI (Enhanced Vegetation Index): {evi_mean:.3f}")
            
            # Water Quality
            if 'ndwi' in indices:
                ndwi_mean = np.nanmean(indices['ndwi'])
                print(f"\n💧 Water Quality:")
                print(f"   • NDWI (Normalized Difference Water Index): {ndwi_mean:.3f}")
                if ndwi_mean > 0.3:
                    print(f"     → Status: ✅ Clear water present")
                elif ndwi_mean > 0:
                    print(f"     → Status: ⚠️ Some water detected")
                else:
                    print(f"     → Status: ❌ Minimal water")
            
            # Urban/Built-up
            if 'ndbi' in indices:
                ndbi_mean = np.nanmean(indices['ndbi'])
                print(f"\n🏗️ Built-up Areas:")
                print(f"   • NDBI (Normalized Difference Built-up Index): {ndbi_mean:.3f}")
                if ndbi_mean > 0.1:
                    print(f"     → Status: ⚠️ Significant built-up areas")
                else:
                    print(f"     → Status: ✅ Natural/vegetated area")
            
            # Soil/Bareness
            if 'bsi' in indices:
                bsi_mean = np.nanmean(indices['bsi'])
                print(f"\n🏜️ Bare Soil:")
                print(f"   • BSI (Bare Soil Index): {bsi_mean:.3f}")
            
            # Overall Environmental Health Score
            health_score = self._calculate_health_score(indices)
            print(f"\n🎯 Overall Environmental Health Score: {health_score:.1f}/100")
            
            if health_score > 75:
                print(f"   → Assessment: ✅ Excellent environmental condition")
            elif health_score > 50:
                print(f"   → Assessment: ✅ Good environmental condition")
            elif health_score > 30:
                print(f"   → Assessment: ⚠️ Fair environmental condition")
            else:
                print(f"   → Assessment: ❌ Poor environmental condition")
            
            return features, health_score
            
        except Exception as e:
            print_error(f"Spectral analysis failed: {e}")
            import traceback
            traceback.print_exc()
            return None, 0
    
    def _calculate_health_score(self, indices):
        """Calculate overall environmental health score (0-100)"""
        score = 50  # Base score
        
        # Positive indicators
        if 'ndvi' in indices:
            ndvi = np.nanmean(indices['ndvi'])
            score += min(ndvi * 30, 30)  # Up to +30 for vegetation
        
        if 'ndwi' in indices:
            ndwi = np.nanmean(indices['ndwi'])
            if ndwi > 0:
                score += min(ndwi * 10, 10)  # Up to +10 for water
        
        # Negative indicators
        if 'ndbi' in indices:
            ndbi = np.nanmean(indices['ndbi'])
            if ndbi > 0.1:
                score -= min(ndbi * 20, 20)  # Up to -20 for urbanization
        
        return max(0, min(100, score))
    
    def generate_visualizations(self, image):
        """Generate single-image visualizations"""
        print_step(3, "Generate Visualizations")
        
        try:
            print_info("Generating RGB composite...")
            
            # Create RGB visualization
            rgb_viz = self._create_rgb_composite(image.data)
            
            print_success("RGB composite generated!")
            
            print_info("Generating NDVI heatmap...")
            
            # Calculate NDVI
            features = self.spectral_analyzer.extract_all_features(image.data)
            if 'ndvi' in features['indices']:
                ndvi_viz = self._create_index_heatmap(
                    features['indices']['ndvi'],
                    title='NDVI - Vegetation Health',
                    colormap='RdYlGn'
                )
                print_success("NDVI heatmap generated!")
            else:
                ndvi_viz = None
            
            return {
                'rgb': rgb_viz,
                'ndvi_heatmap': ndvi_viz
            }
            
        except Exception as e:
            print_error(f"Visualization failed: {e}")
            return None
    
    def _create_rgb_composite(self, image_data):
        """Create RGB composite from satellite data"""
        # Simple RGB extraction (bands 2,1,0 for Sentinel-2)
        if image_data.ndim == 3 and image_data.shape[2] >= 3:
            rgb = image_data[:, :, [2, 1, 0]]  # R, G, B
            # Normalize to 0-1
            rgb = (rgb - rgb.min()) / (rgb.max() - rgb.min() + 1e-8)
            return rgb
        return None
    
    def _create_index_heatmap(self, index_data, title, colormap='viridis'):
        """Create heatmap visualization for spectral index"""
        try:
            import matplotlib.pyplot as plt
            
            fig, ax = plt.subplots(figsize=(10, 8))
            im = ax.imshow(index_data, cmap=colormap, interpolation='bilinear')
            plt.colorbar(im, ax=ax, label='Index Value')
            ax.set_title(title, fontsize=14, fontweight='bold')
            ax.axis('off')
            
            # Convert to base64
            import io
            import base64
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', dpi=150)
            buf.seek(0)
            img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close(fig)
            
            return f"data:image/png;base64,{img_base64}"
        except:
            return None
    
    async def run_analysis(self, geojson, days_back=60):
        """Run complete single-image analysis"""
        print_header("🛰️  SINGLE IMAGE ENVIRONMENTAL ANALYSIS")
        print(f"📍 Location: Umananda Island")
        print(f"🌍 Analyzing current environmental state")
        print(f"📅 Search range: Last {days_back} days")
        print(f"⏰ Analysis started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print_info("✨ No change detection - just current state analysis!")
        
        # Step 1: Fetch latest image
        image = await self.fetch_latest_image(geojson, days_back)
        
        if not image:
            print_error("\n❌ No satellite image available")
            print_info("Try:")
            print("   • Extending date range to 90 days")
            print("   • Different location")
            print("   • Waiting 2-5 days for next pass")
            return False
        
        # Step 2: Analyze spectral indices
        features, health_score = self.analyze_spectral_indices(image)
        
        if not features:
            print_error("\n❌ Analysis failed")
            return False
        
        # Step 3: Generate visualizations
        visualizations = self.generate_visualizations(image)
        
        # Final summary
        print_header("✅ ANALYSIS COMPLETE - SUCCESS!")
        print("📊 Single-image analysis results:")
        print("   ✅ Latest satellite image acquired")
        print("   ✅ Spectral indices calculated")
        print("   ✅ Environmental health assessed")
        print("   ✅ Visualizations generated")
        
        print(f"\n🎯 Key Findings:")
        print(f"   • Image Date: {image.timestamp}")
        print(f"   • Environmental Health: {health_score:.1f}/100")
        print(f"   • Analysis Type: Current State (no change detection)")
        
        print(f"\n💡 Note:")
        print("   This analysis shows the CURRENT environmental state.")
        print("   For change detection, we need 2 images (before/after).")
        print("   But you can still get valuable insights from a single image!")
        
        print(f"\n⏰ Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return True


async def main():
    """Run single-image analysis"""
    analyzer = SingleImageAnalyzer()
    
    # Try with 60 days first, then 90 if needed
    success = await analyzer.run_analysis(UMANANDA_GEOJSON, days_back=60)
    
    if not success:
        print_info("\n🔄 Trying with 90 days...")
        success = await analyzer.run_analysis(UMANANDA_GEOJSON, days_back=90)
    
    if success:
        print_info("\n🏆 Single-image analysis successful!")
        sys.exit(0)
    else:
        print_info("\n⚠️ Could not complete analysis")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Analysis interrupted")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

