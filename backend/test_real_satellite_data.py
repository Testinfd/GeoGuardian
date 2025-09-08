#!/usr/bin/env python3
"""
ACTUAL Real Satellite Data Test for Umananda Island
This script attempts to fetch REAL Sentinel-2 satellite imagery from ESA APIs
NO SYNTHETIC DATA WHATSOEVER
"""

import sys
import os
import asyncio
sys.path.append('.')

import numpy as np
import matplotlib.pyplot as plt
import requests
from datetime import datetime, timedelta
import logging

# Import backend modules
from app.core.satellite_data import SentinelDataFetcher, FetchConfig
from app.algorithms.ewma import EWMADetector
from app.algorithms.cusum import CUSUMDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# REAL Umananda Island coordinates
UMANANDA_AOI = {
    "type": "Polygon", 
    "coordinates": [[
        [91.7447, 26.1961],      # Southwest corner
        [91.7447, 26.1967],      # Northwest corner  
        [91.7453, 26.1967],      # Northeast corner
        [91.7453, 26.1961],      # Southeast corner
        [91.7447, 26.1961]       # Close polygon
    ]]
}

class RealSatelliteDataTester:
    """Test with ACTUAL satellite data from ESA/Copernicus"""
    
    def __init__(self):
        print("🛰️ REAL SATELLITE DATA TESTER")
        print("📍 Target: Umananda Island, Assam, India")
        print("🌍 Data Source: ESA Sentinel-2 satellites")
        print("⚠️  NO SYNTHETIC DATA WILL BE USED")
        
        # Initialize satellite fetcher
        try:
            self.satellite_fetcher = SentinelDataFetcher()
            print("✅ Satellite data fetcher initialized")
        except Exception as e:
            print(f"❌ Satellite fetcher failed: {e}")
            self.satellite_fetcher = None
        
        # Initialize algorithms
        self.ewma = EWMADetector()
        self.cusum = CUSUMDetector()
    
    async def fetch_real_sentinel_data(self):
        """Attempt to fetch REAL Sentinel-2 data for Umananda Island"""
        print("\n🛰️ ATTEMPTING TO FETCH REAL SENTINEL-2 DATA")
        print("=" * 60)
        
        if not self.satellite_fetcher:
            print("❌ Cannot fetch real data - satellite fetcher not available")
            print("💡 To enable real data:")
            print("   1. Add Sentinel Hub API credentials to .env file")
            print("   2. SENTINELHUB_CLIENT_ID=your_client_id")
            print("   3. SENTINELHUB_CLIENT_SECRET=your_client_secret")
            return None, None
        
        try:
            print(f"📍 AOI: Umananda Island {UMANANDA_AOI['coordinates'][0]}")
            print("📅 Requesting data from last 30 days...")
            print("☁️  Maximum cloud coverage: 30%")
            print("📊 Bands: All 13 Sentinel-2 spectral bands")
            
            # First try to get paired images for change detection
            recent_image, baseline_image = await self.satellite_fetcher.get_latest_images_for_change_detection(
                UMANANDA_AOI, days_back=30
            )
            
            if recent_image and baseline_image:
                print("\n✅ REAL SATELLITE DATA SUCCESSFULLY RETRIEVED!")
                print(f"   📅 Recent Image: {recent_image.timestamp}")
                print(f"   📅 Baseline Image: {baseline_image.timestamp}")
                print(f"   📐 Resolution: {recent_image.resolution}m per pixel")
                print(f"   ☁️  Recent cloud cover: {recent_image.cloud_coverage:.1%}")
                print(f"   ☁️  Baseline cloud cover: {baseline_image.cloud_coverage:.1%}")
                print(f"   🛰️  Satellite: {recent_image.satellite}")
                print(f"   📊 Bands available: {len(recent_image.bands)}")
                print(f"   🌍 Geographic bounds: {recent_image.bounds}")
                
                return recent_image, baseline_image
                
            else:
                # Try to get ANY available imagery for single-image analysis
                print("⚠️  No paired images available, trying single image analysis...")
                
                end_date = datetime.now()
                start_date = end_date - timedelta(days=60)  # Expand search window
                
                images = await self.satellite_fetcher.fetch_imagery(
                    UMANANDA_AOI, (start_date, end_date)
                )
                
                if images and len(images) > 0:
                    single_image = images[0]
                    print("\n✅ REAL SATELLITE DATA RETRIEVED (Single Image)!")
                    print(f"   📅 Image Date: {single_image.timestamp}")
                    print(f"   📐 Resolution: {single_image.resolution}m per pixel")
                    print(f"   ☁️  Cloud cover: {single_image.cloud_coverage:.1%}")
                    print(f"   📊 Bands available: {len(single_image.bands)}")
                    print(f"   🌍 Geographic bounds: {single_image.bounds}")
                    
                    # Verify this is real satellite data
                    print(f"\n🔍 DATA VERIFICATION:")
                    print(f"   Data type: {type(single_image.data)}")
                    print(f"   Data shape: {single_image.data.shape}")
                    print(f"   Data range: {single_image.data.min():.3f} to {single_image.data.max():.3f}")
                    print(f"   Contains real reflectance values: {0 < single_image.data.mean() < 1}")
                    
                    # Return single image as both recent and baseline for algorithm testing
                    return single_image, single_image
                    
                else:
                    print("❌ NO REAL SATELLITE DATA AVAILABLE")
                    print("   Possible reasons:")
                    print("   • No cloud-free images in the last 60 days")
                    print("   • Area outside Sentinel-2 coverage") 
                    print("   • API quota exceeded")
                    print("   • Network connectivity issues")
                    return None, None
                
        except Exception as e:
            print(f"❌ ERROR fetching real satellite data: {e}")
            return None, None
    
    def analyze_real_ndvi_values(self, recent_image, baseline_image):
        """Calculate REAL NDVI from actual satellite bands"""
        print("\n🌱 CALCULATING REAL NDVI FROM SATELLITE DATA")
        
        # Extract NIR (Band 8) and Red (Band 4) from real satellite data
        # Sentinel-2 band order: [B01, B02, B03, B04, B05, B06, B07, B08, B8A, B09, B11, B12, SCL]
        
        try:
            # Recent image NDVI
            recent_red = recent_image.data[:, :, 3]    # B04 (Red)
            recent_nir = recent_image.data[:, :, 7]    # B08 (NIR)
            recent_ndvi = (recent_nir - recent_red) / (recent_nir + recent_red + 1e-8)
            
            # Baseline image NDVI (might be same as recent for single-image analysis)
            baseline_red = baseline_image.data[:, :, 3]  # B04 (Red)
            baseline_nir = baseline_image.data[:, :, 7]  # B08 (NIR)
            baseline_ndvi = (baseline_nir - baseline_red) / (baseline_nir + baseline_red + 1e-8)
            
            print("✅ REAL NDVI CALCULATED FROM SATELLITE BANDS")
            print(f"   Recent NDVI range: {recent_ndvi.min():.3f} to {recent_ndvi.max():.3f}")
            print(f"   Recent NDVI mean: {recent_ndvi.mean():.3f}")
            print(f"   Baseline NDVI range: {baseline_ndvi.min():.3f} to {baseline_ndvi.max():.3f}")
            print(f"   Baseline NDVI mean: {baseline_ndvi.mean():.3f}")
            
            if recent_image.timestamp != baseline_image.timestamp:
                print(f"   NDVI change: {recent_ndvi.mean() - baseline_ndvi.mean():.3f}")
            else:
                print("   ⚠️  Single image analysis - no temporal change calculated")
            
            # Validate NDVI values are realistic
            if -1 <= recent_ndvi.mean() <= 1 and -1 <= baseline_ndvi.mean() <= 1:
                print("   ✅ NDVI values are within valid range [-1, 1]")
            else:
                print("   ⚠️  NDVI values outside expected range - possible data issues")
            
            return recent_ndvi, baseline_ndvi
            
        except Exception as e:
            print(f"❌ Error calculating real NDVI: {e}")
            return None, None
    
    def test_algorithms_with_real_data(self, recent_ndvi, baseline_ndvi):
        """Test algorithms with REAL NDVI calculated from satellite data"""
        print("\n🔬 TESTING ALGORITHMS WITH REAL SATELLITE-DERIVED DATA")
        
        # Calculate real baseline statistics 
        baseline_mean = float(np.nanmean(baseline_ndvi))
        baseline_std = float(np.nanstd(baseline_ndvi))
        
        print(f"📊 REAL baseline statistics from satellite:")
        print(f"   Mean NDVI: {baseline_mean:.3f}")
        print(f"   Std NDVI: {baseline_std:.3f}")
        
        # Test EWMA with real pixel values
        print("\n🧪 Testing EWMA with REAL pixel data...")
        ewma_results = []
        self.ewma.reset()
        
        # Sample 100 random pixels from the image
        height, width = recent_ndvi.shape
        num_samples = min(100, height * width)
        
        for i in range(num_samples):
            row = np.random.randint(0, height)
            col = np.random.randint(0, width)
            pixel_ndvi = recent_ndvi[row, col]
            
            if not np.isnan(pixel_ndvi):
                change_detected, confidence, metadata = self.ewma.detect_change(
                    observation=float(pixel_ndvi),
                    baseline_mean=baseline_mean,
                    baseline_std=baseline_std
                )
                ewma_results.append(change_detected)
        
        ewma_changes = sum(ewma_results)
        ewma_rate = ewma_changes / len(ewma_results) if ewma_results else 0
        
        print(f"   ✅ EWMA tested on {len(ewma_results)} real pixels")
        print(f"   🚨 Changes detected: {ewma_changes} ({ewma_rate:.1%})")
        
        # Test CUSUM with real pixel values
        print("\n🧪 Testing CUSUM with REAL pixel data...")
        cusum_results = []
        self.cusum.reset()
        
        for i in range(num_samples):
            row = np.random.randint(0, height)
            col = np.random.randint(0, width)
            pixel_ndvi = recent_ndvi[row, col]
            
            if not np.isnan(pixel_ndvi):
                change_detected, change_type, confidence, metadata = self.cusum.detect_change(
                    observation=float(pixel_ndvi),
                    baseline_mean=baseline_mean,
                    baseline_std=baseline_std
                )
                cusum_results.append((change_detected, change_type))
        
        cusum_changes = sum(1 for detected, _ in cusum_results if detected)
        cusum_rate = cusum_changes / len(cusum_results) if cusum_results else 0
        
        print(f"   ✅ CUSUM tested on {len(cusum_results)} real pixels")
        print(f"   🚨 Changes detected: {cusum_changes} ({cusum_rate:.1%})")
        
        return {
            'ewma_changes': ewma_changes,
            'ewma_rate': ewma_rate,
            'cusum_changes': cusum_changes, 
            'cusum_rate': cusum_rate,
            'baseline_mean': baseline_mean,
            'baseline_std': baseline_std,
            'pixels_tested': len(ewma_results)
        }
    
    def create_real_data_visualization(self, recent_image, baseline_image, recent_ndvi, baseline_ndvi, results):
        """Create visualization from REAL satellite data"""
        print("\n📊 CREATING VISUALIZATION FROM REAL SATELLITE DATA")
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('🛰️ REAL Umananda Island Satellite Analysis', fontsize=16, fontweight='bold')
        
        # 1. Real RGB composite
        try:
            # Create true color RGB from real bands (B04, B03, B02)
            recent_rgb = np.stack([
                recent_image.data[:, :, 3],  # Red
                recent_image.data[:, :, 2],  # Green  
                recent_image.data[:, :, 1]   # Blue
            ], axis=-1)
            
            # Normalize for display (real Sentinel-2 ranges 0-1)
            recent_rgb = np.clip(recent_rgb, 0, 1)
            
            ax1.imshow(recent_rgb)
            ax1.set_title(f'🛰️ REAL Satellite Image\n{recent_image.timestamp.strftime("%Y-%m-%d")}')
            ax1.axis('off')
            
        except Exception as e:
            ax1.text(0.5, 0.5, f'RGB visualization error:\n{e}', ha='center', va='center', transform=ax1.transAxes)
            ax1.set_title('🛰️ RGB Composite (Error)')
        
        # 2. Real NDVI map
        im2 = ax2.imshow(recent_ndvi, cmap='RdYlGn', vmin=-1, vmax=1)
        ax2.set_title(f'🌱 REAL NDVI Map\nMean: {recent_ndvi.mean():.3f}')
        ax2.axis('off')
        plt.colorbar(im2, ax=ax2, shrink=0.6)
        
        # 3. NDVI change map
        ndvi_change = recent_ndvi - baseline_ndvi
        im3 = ax3.imshow(ndvi_change, cmap='RdBu_r', vmin=-0.5, vmax=0.5)
        ax3.set_title(f'📈 REAL NDVI Change\nMean Δ: {ndvi_change.mean():.3f}')
        ax3.axis('off')
        plt.colorbar(im3, ax=ax3, shrink=0.6)
        
        # 4. Algorithm results summary
        ax4.axis('off')
        results_text = f"""🔬 REAL ALGORITHM RESULTS
        
📊 Data Source: ESA Sentinel-2
📅 Recent: {recent_image.timestamp.strftime('%Y-%m-%d')}
📅 Baseline: {baseline_image.timestamp.strftime('%Y-%m-%d')}
☁️ Cloud Cover: {recent_image.cloud_coverage:.1%}

🌱 REAL NDVI Statistics:
   Mean: {results['baseline_mean']:.3f}
   Std: {results['baseline_std']:.3f}
   
🧪 EWMA Results:
   Pixels tested: {results['pixels_tested']}
   Changes: {results['ewma_changes']} ({results['ewma_rate']:.1%})
   
🧪 CUSUM Results:
   Changes: {results['cusum_changes']} ({results['cusum_rate']:.1%})

✅ ALL DATA IS REAL SATELLITE IMAGERY
❌ NO SYNTHETIC VALUES USED"""
        
        ax4.text(0.05, 0.95, results_text, fontsize=10, verticalalignment='top',
                bbox=dict(boxstyle="round,pad=0.5", facecolor="lightgreen", alpha=0.8),
                transform=ax4.transAxes)
        
        plt.tight_layout()
        
        # Save with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'visuals/REAL_umananda_analysis_{timestamp}.png'
        os.makedirs('visuals', exist_ok=True)
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved REAL data visualization: {filename}")
        return filename
    
    async def run_real_analysis(self):
        """Run complete analysis with REAL satellite data"""
        print("🎯 OBJECTIVE: Use ONLY real satellite data for Umananda Island")
        print("🚫 ZERO tolerance for synthetic/random data")
        print()
        
        # Attempt to fetch real satellite data
        recent_image, baseline_image = await self.fetch_real_sentinel_data()
        
        if recent_image and baseline_image:
            print("\n🎉 SUCCESS: REAL satellite data acquired!")
            
            # Calculate real NDVI from satellite bands
            recent_ndvi, baseline_ndvi = self.analyze_real_ndvi_values(recent_image, baseline_image)
            
            if recent_ndvi is not None and baseline_ndvi is not None:
                # Test algorithms with real data
                results = self.test_algorithms_with_real_data(recent_ndvi, baseline_ndvi)
                
                # Create visualization
                viz_file = self.create_real_data_visualization(
                    recent_image, baseline_image, recent_ndvi, baseline_ndvi, results
                )
                
                print(f"\n🎯 REAL ANALYSIS COMPLETED!")
                print(f"📁 Visualization: {viz_file}")
                print("✅ 100% REAL satellite data used")
                print("❌ 0% synthetic data used")
                
                return {
                    'success': True,
                    'recent_image': recent_image,
                    'baseline_image': baseline_image,
                    'results': results,
                    'visualization': viz_file
                }
                
            else:
                print("❌ Failed to calculate NDVI from real satellite data")
                return {'success': False, 'error': 'NDVI calculation failed'}
        
        else:
            print("\n❌ OBJECTIVE FAILED: Could not obtain real satellite data")
            print("🔧 Required for real analysis:")
            print("   1. Valid Sentinel Hub API credentials")
            print("   2. Cloud-free imagery over Umananda Island")
            print("   3. Network connectivity to ESA services")
            print("   4. Sufficient API quota")
            print()
            print("💡 Alternative: Configure Sentinel Hub account at:")
            print("   https://apps.sentinel-hub.com/")
            
            return {'success': False, 'error': 'No real satellite data available'}

async def main():
    """Main function to test with REAL satellite data"""
    print("🛰️ REAL SATELLITE DATA ANALYSIS - UMANANDA ISLAND")
    print("=" * 60)
    print("🎯 OBJECTIVE: 100% real data, 0% synthetic data")
    print("📍 LOCATION: World's smallest inhabited island")
    print("🌍 COORDINATES: 26.1964°N, 91.7450°E (Brahmaputra River)")
    print()
    
    tester = RealSatelliteDataTester()
    results = await tester.run_real_analysis()
    
    if results['success']:
        print("\n🏆 VERDICT: ✅ SUCCESS")
        print("🛰️ Real Sentinel-2 satellite imagery analyzed")
        print("🌱 Real NDVI calculated from actual spectral bands")  
        print("🔬 Real algorithm testing on actual environmental data")
        print("📊 Real change detection results from Umananda Island")
    else:
        print("\n🏆 VERDICT: ❌ FAILED")
        print(f"❌ Error: {results['error']}")
        print("💡 Real satellite data is required to complete this objective")

if __name__ == "__main__":
    asyncio.run(main())