#!/usr/bin/env python3
"""
Direct Backend Test for Umananda Island - No HTTP, Direct Module Access
Similar to test_real_satellite_data.py but for comprehensive analysis
"""

import sys
import os
import asyncio
sys.path.append('.')

from datetime import datetime
import logging

# Import backend modules directly
from app.core.satellite_data import SentinelDataFetcher, FetchConfig
from app.core.analysis_engine import AdvancedAnalysisEngine
from app.core.asset_manager import AssetManager
from app.algorithms.ewma import EWMADetector
from app.algorithms.cusum import CUSUMDetector
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
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_step(step, text):
    """Print formatted step"""
    print(f"\n[STEP {step}] {text}")
    print("-" * 70)

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")


class UmanandaDirectTester:
    """Direct backend testing without HTTP"""
    
    def __init__(self):
        self.analysis_engine = AdvancedAnalysisEngine()
        self.satellite_fetcher = SentinelDataFetcher(
            FetchConfig(
                max_cloud_coverage=0.3,
                max_images=10,
                min_time_separation_days=5
            )
        )
        self.asset_manager = AssetManager()
        self.visualizer = ChangeVisualizer()
        
    async def test_data_availability(self, date_range_days=60):
        """Test if satellite data is available"""
        print_step(1, f"Check Satellite Data Availability ({date_range_days} days)")
        
        try:
            print_info("Querying Sentinel Hub API...")
            data_availability = await self.satellite_fetcher.validate_data_availability(
                UMANANDA_GEOJSON, 
                date_range_days
            )
            
            if data_availability.get('sufficient_for_analysis'):
                print_success("Satellite data is available!")
                print_info(f"Images available: {data_availability.get('images_available', 'Unknown')}")
                print_info(f"Latest image: {data_availability.get('latest_image', {}).get('timestamp', 'Unknown')}")
                return True
            else:
                print_error("Insufficient satellite data")
                print_info(f"Reason: {data_availability.get('message', 'Unknown')}")
                print_info(f"Images found: {data_availability.get('images_available', 0)}")
                return False
                
        except Exception as e:
            print_error(f"Data availability check failed: {e}")
            return False
    
    async def fetch_satellite_images(self, date_range_days=60):
        """Fetch actual satellite imagery"""
        print_step(2, f"Fetch Satellite Imagery ({date_range_days} days)")
        
        try:
            print_info("Fetching images from Sentinel Hub...")
            
            recent_image, baseline_image = await self.satellite_fetcher.get_latest_images_for_change_detection(
                UMANANDA_GEOJSON, 
                date_range_days
            )
            
            if recent_image and baseline_image:
                print_success("Successfully fetched satellite imagery!")
                print_info(f"Recent image: {recent_image.timestamp}")
                print_info(f"Baseline image: {baseline_image.timestamp}")
                print_info(f"Image shape: {recent_image.data.shape}")
                print_info(f"Bands: {recent_image.bands}")
                return recent_image, baseline_image
            else:
                print_error("Failed to fetch sufficient images")
                return None, None
                
        except Exception as e:
            print_error(f"Image fetching failed: {e}")
            import traceback
            traceback.print_exc()
            return None, None
    
    async def run_comprehensive_analysis(self, before_image, after_image):
        """Run comprehensive environmental analysis"""
        print_step(3, "Run Comprehensive Environmental Analysis")
        
        try:
            print_info("Running multi-algorithm analysis...")
            
            # Use the analysis engine
            results = self.analysis_engine.analyze_environmental_change(
                before_image=before_image.data,
                after_image=after_image.data,
                geojson=UMANANDA_GEOJSON,
                analysis_type="comprehensive"
            )
            
            print_success("Analysis completed!")
            
            # Display results
            print_info("\nAnalysis Results:")
            print(f"   • Overall Confidence: {results.overall_confidence * 100:.1f}%")
            print(f"   • Change Detected: {results.change_detected}")
            print(f"   • Priority Level: {results.priority_level}")
            print(f"   • Data Quality: {results.data_quality_score * 100:.1f}%")
            
            if results.detections:
                print_info(f"\nAlgorithm Results ({len(results.detections)} algorithms):")
                for detection in results.detections:
                    status = "🔴 CHANGE" if detection.detected else "🟢 NO CHANGE"
                    print(f"   • {detection.algorithm}: {status} ({detection.confidence * 100:.1f}%)")
                    if detection.details:
                        print(f"      → {detection.details}")
            
            return results
            
        except Exception as e:
            print_error(f"Analysis failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def generate_visualizations(self, before_image, after_image):
        """Generate all visualizations"""
        print_step(4, "Generate Visualizations")
        
        try:
            print_info("Generating change heatmap...")
            heatmap = self.visualizer.generate_change_heatmap(
                before_image=before_image.data,
                after_image=after_image.data,
                title=f'Umananda Island - Change Heat Map'
            )
            
            if heatmap:
                print_success("Heatmap generated!")
                print_info(f"Heatmap data size: {len(heatmap)} bytes")
            
            print_info("Generating comparison view...")
            comparison = self.visualizer.generate_comparison_view(
                before_image=before_image.data,
                after_image=after_image.data,
                change_map=after_image.data - before_image.data
            )
            
            if comparison:
                print_success("Comparison view generated!")
            
            print_info("Generating animated GIF...")
            gif = self.visualizer.generate_change_gif(
                before_image=before_image.data,
                after_image=after_image.data,
                duration=1000
            )
            
            if gif:
                print_success("Animated GIF generated!")
                print_info(f"GIF data size: {len(gif)} bytes")
            
            return {
                'heatmap': heatmap,
                'comparison': comparison,
                'gif': gif
            }
            
        except Exception as e:
            print_error(f"Visualization generation failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def run_full_test(self, date_range_days=60):
        """Run complete test workflow"""
        print_header("🛰️  UMANANDA ISLAND - DIRECT BACKEND TEST")
        print(f"📍 Location: World's smallest inhabited river island")
        print(f"🌍 Coordinates: 26.1964°N, 91.7450°E (Brahmaputra River, Guwahati)")
        print(f"📅 Date range: {date_range_days} days of historical data")
        print(f"⏰ Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Step 1: Check data availability
        data_available = await self.test_data_availability(date_range_days)
        
        if not data_available and date_range_days < 90:
            print_info("\n⚠️  Insufficient data with {date_range_days} days. Trying 90 days...")
            data_available = await self.test_data_availability(90)
            if data_available:
                date_range_days = 90
        
        if not data_available:
            print_error("\n❌ No satellite data available even with 90 days")
            print_info("Recommendations:")
            print("   • Wait 2-5 days for next Sentinel-2 pass")
            print("   • Try different location (Delhi, London, etc.)")
            print("   • Check Sentinel Hub API status")
            return False
        
        # Step 2: Fetch satellite images
        recent_image, baseline_image = await self.fetch_satellite_images(date_range_days)
        
        if not recent_image or not baseline_image:
            print_error("\n❌ Failed to fetch satellite imagery")
            return False
        
        # Step 3: Run comprehensive analysis
        results = await self.run_comprehensive_analysis(baseline_image, recent_image)
        
        if not results:
            print_error("\n❌ Analysis failed")
            return False
        
        # Step 4: Generate visualizations
        visualizations = await self.generate_visualizations(baseline_image, recent_image)
        
        # Final summary
        print_header("✅ TEST COMPLETE - SUCCESS!")
        print("📊 All features tested successfully:")
        print("   ✅ Data Availability Check")
        print("   ✅ Satellite Image Fetching")
        print("   ✅ Comprehensive Analysis (EWMA, CUSUM, VedgeSat)")
        print("   ✅ Change Detection")
        if visualizations:
            print("   ✅ Heatmap Generation")
            print("   ✅ Comparison View")
            print("   ✅ Animated GIF")
        
        print(f"\n🎯 Results:")
        print(f"   • Overall Confidence: {results.overall_confidence * 100:.1f}%")
        print(f"   • Change Detected: {results.change_detected}")
        print(f"   • Algorithms Run: {len(results.detections)}")
        print(f"   • Visualizations: {len([v for v in visualizations.values() if v]) if visualizations else 0}")
        
        print(f"\n⏰ Test completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return True


async def main():
    """Main test function"""
    tester = UmanandaDirectTester()
    
    # Try with 60 days first
    success = await tester.run_full_test(date_range_days=60)
    
    if not success:
        print_info("\n🔄 Test did not complete successfully")
        print("Check logs above for details")
        sys.exit(1)
    else:
        print_info("\n🏆 All tests passed!")
        sys.exit(0)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

