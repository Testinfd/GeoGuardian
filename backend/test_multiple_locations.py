#!/usr/bin/env python3
"""
Multi-Location Environmental Analysis with Visualizations
Tests: Chilika Lake, Delhi, and Guwahati
"""

import sys
import os
import asyncio
sys.path.append('.')

from datetime import datetime, timedelta
import logging
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# Import backend modules
from app.core.satellite_data import SentinelDataFetcher, FetchConfig
from app.core.spectral_analyzer import SpectralAnalyzer
from app.algorithms.visualization import ChangeVisualizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test locations
LOCATIONS = {
    "Chilika Lake": {
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [85.3200, 19.7000],  # Southwest
                [85.3200, 19.7200],  # Northwest
                [85.3400, 19.7200],  # Northeast
                [85.3400, 19.7000],  # Southeast
                [85.3200, 19.7000]   # Close
            ]]
        },
        "description": "Asia's largest brackish water lagoon, Odisha, India",
        "expected_features": ["water", "coastal", "wetland"]
    },
    "Delhi": {
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.2050, 28.6100],  # Southwest
                [77.2050, 28.6180],  # Northwest
                [77.2130, 28.6180],  # Northeast
                [77.2130, 28.6100],  # Southeast
                [77.2050, 28.6100]   # Close
            ]]
        },
        "description": "National capital of India - Urban center",
        "expected_features": ["urban", "built-up", "high-density"]
    },
    "Guwahati": {
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [91.7330, 26.1415],  # Southwest
                [91.7330, 26.1475],  # Northwest
                [91.7390, 26.1475],  # Northeast
                [91.7390, 26.1415],  # Southeast
                [91.7330, 26.1415]   # Close
            ]]
        },
        "description": "Gateway to Northeast India - Urban area near Brahmaputra River",
        "expected_features": ["urban", "river", "vegetation"]
    }
}

# Create output directory
OUTPUT_DIR = Path("analysis_results")
OUTPUT_DIR.mkdir(exist_ok=True)

def print_header(text):
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)

def print_section(text):
    print("\n" + "-" * 80)
    print(f"  {text}")
    print("-" * 80)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")


class MultiLocationAnalyzer:
    """Analyze multiple locations with visualization output"""
    
    def __init__(self):
        self.satellite_fetcher = SentinelDataFetcher(
            FetchConfig(max_cloud_coverage=0.4, max_images=1)  # Slightly relaxed for more coverage
        )
        self.spectral_analyzer = SpectralAnalyzer()
        self.visualizer = ChangeVisualizer()
        self.results = {}
    
    async def analyze_location(self, location_name, location_data, days_back=60):
        """Analyze a single location"""
        print_section(f"Analyzing: {location_name}")
        print_info(f"Description: {location_data['description']}")
        print_info(f"Expected features: {', '.join(location_data['expected_features'])}")
        
        try:
            # Fetch latest image
            print_info("Fetching satellite imagery...")
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            images = await self.satellite_fetcher.fetch_imagery(
                aoi_geometry=location_data['geojson'],
                date_range=(start_date, end_date),
                bands=None
            )
            
            if not images or len(images) == 0:
                print_error(f"No satellite imagery found for {location_name}")
                return None
            
            image = images[0]
            print_success(f"Image acquired: {image.timestamp}")
            print_info(f"Cloud cover: {image.cloud_coverage:.1f}%")
            print_info(f"Image shape: {image.data.shape}")
            
            # Analyze spectral indices
            print_info("Analyzing spectral indices...")
            features = self.spectral_analyzer.extract_all_features(image.data)
            indices = features['indices']
            
            # Calculate metrics
            results = {
                'location': location_name,
                'description': location_data['description'],
                'image_date': str(image.timestamp),
                'cloud_cover': float(image.cloud_coverage),
                'image_shape': image.data.shape,
                'indices': {},
                'health_score': 0,
                'dominant_feature': '',
                'assessment': ''
            }
            
            # Calculate mean values for each index
            for idx_name, idx_data in indices.items():
                mean_val = float(np.nanmean(idx_data))
                results['indices'][idx_name] = {
                    'mean': mean_val,
                    'min': float(np.nanmin(idx_data)),
                    'max': float(np.nanmax(idx_data)),
                    'std': float(np.nanstd(idx_data))
                }
            
            # Display key metrics
            print_info("\n📊 Spectral Analysis Results:")
            
            if 'ndvi' in indices:
                ndvi = results['indices']['ndvi']['mean']
                print(f"\n🌱 Vegetation:")
                print(f"   • NDVI: {ndvi:.3f}")
                if ndvi > 0.6:
                    print(f"     → ✅ Dense/healthy vegetation")
                elif ndvi > 0.3:
                    print(f"     → ⚠️ Moderate vegetation")
                elif ndvi > 0.1:
                    print(f"     → 🟡 Sparse vegetation")
                else:
                    print(f"     → ❌ Little/no vegetation")
            
            if 'ndwi' in indices:
                ndwi = results['indices']['ndwi']['mean']
                print(f"\n💧 Water:")
                print(f"   • NDWI: {ndwi:.3f}")
                if ndwi > 0.3:
                    print(f"     → ✅ Significant water bodies")
                elif ndwi > 0:
                    print(f"     → 🟡 Some water present")
                else:
                    print(f"     → ❌ Dry/no water")
            
            if 'ndbi' in indices:
                ndbi = results['indices']['ndbi']['mean']
                print(f"\n🏗️ Built-up:")
                print(f"   • NDBI: {ndbi:.3f}")
                if ndbi > 0.1:
                    print(f"     → ⚠️ Urban/built-up area")
                else:
                    print(f"     → ✅ Natural area")
            
            # Calculate health score and dominant feature
            health_score = self._calculate_health_score(results['indices'])
            dominant_feature = self._determine_dominant_feature(results['indices'])
            
            results['health_score'] = health_score
            results['dominant_feature'] = dominant_feature
            results['assessment'] = self._get_assessment(health_score)
            
            print(f"\n🎯 Environmental Health Score: {health_score:.1f}/100")
            print(f"   → {results['assessment']}")
            print(f"\n🔍 Dominant Feature: {dominant_feature}")
            
            # Generate visualizations
            print_info("\nGenerating visualizations...")
            viz_paths = await self._generate_visualizations(
                location_name, image, indices, results
            )
            results['visualizations'] = viz_paths
            
            if viz_paths:
                print_success(f"Generated {len(viz_paths)} visualizations")
                for viz_type, path in viz_paths.items():
                    print(f"   • {viz_type}: {path}")
            
            self.results[location_name] = results
            return results
            
        except Exception as e:
            print_error(f"Analysis failed for {location_name}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _calculate_health_score(self, indices):
        """Calculate environmental health score"""
        score = 50
        
        # Vegetation health
        if 'ndvi' in indices:
            ndvi = indices['ndvi']['mean']
            score += min(ndvi * 25, 25)
        
        # Water presence (positive for natural areas)
        if 'ndwi' in indices:
            ndwi = indices['ndwi']['mean']
            if ndwi > 0:
                score += min(ndwi * 15, 15)
        
        # Urbanization (negative impact on "natural" health)
        if 'ndbi' in indices:
            ndbi = indices['ndbi']['mean']
            if ndbi > 0.1:
                score -= min(ndbi * 20, 20)
        
        # EVI (enhanced vegetation)
        if 'evi' in indices:
            evi = indices['evi']['mean']
            score += min(evi * 10, 10)
        
        return max(0, min(100, score))
    
    def _determine_dominant_feature(self, indices):
        """Determine dominant land cover feature"""
        scores = {}
        
        if 'ndvi' in indices:
            scores['Vegetation'] = indices['ndvi']['mean']
        if 'ndwi' in indices:
            scores['Water'] = indices['ndwi']['mean']
        if 'ndbi' in indices:
            scores['Urban'] = indices['ndbi']['mean']
        
        if scores:
            return max(scores, key=scores.get)
        return "Unknown"
    
    def _get_assessment(self, score):
        """Get textual assessment from score"""
        if score > 75:
            return "✅ Excellent environmental condition"
        elif score > 60:
            return "✅ Good environmental condition"
        elif score > 40:
            return "⚠️ Fair environmental condition"
        elif score > 25:
            return "⚠️ Poor environmental condition"
        else:
            return "❌ Very poor environmental condition"
    
    async def _generate_visualizations(self, location_name, image, indices, results):
        """Generate and save visualizations"""
        viz_paths = {}
        safe_name = location_name.replace(" ", "_").lower()
        
        try:
            # 1. RGB Composite
            if image.data.ndim == 3 and image.data.shape[2] >= 3:
                fig, ax = plt.subplots(figsize=(10, 8))
                rgb = self._create_rgb_composite(image.data)
                ax.imshow(rgb)
                ax.set_title(f'{location_name} - RGB Composite\n{results["image_date"]}', 
                           fontsize=14, fontweight='bold')
                ax.axis('off')
                
                path = OUTPUT_DIR / f"{safe_name}_rgb.png"
                plt.savefig(path, dpi=150, bbox_inches='tight')
                plt.close(fig)
                viz_paths['RGB'] = str(path)
            
            # 2. NDVI Heatmap
            if 'ndvi' in indices:
                fig, ax = plt.subplots(figsize=(10, 8))
                im = ax.imshow(indices['ndvi'], cmap='RdYlGn', vmin=-0.2, vmax=1.0)
                plt.colorbar(im, ax=ax, label='NDVI Value')
                ax.set_title(f'{location_name} - Vegetation Health (NDVI)\n{results["image_date"]}',
                           fontsize=14, fontweight='bold')
                ax.axis('off')
                
                path = OUTPUT_DIR / f"{safe_name}_ndvi.png"
                plt.savefig(path, dpi=150, bbox_inches='tight')
                plt.close(fig)
                viz_paths['NDVI'] = str(path)
            
            # 3. NDWI Heatmap (Water)
            if 'ndwi' in indices:
                fig, ax = plt.subplots(figsize=(10, 8))
                im = ax.imshow(indices['ndwi'], cmap='Blues', vmin=-0.5, vmax=1.0)
                plt.colorbar(im, ax=ax, label='NDWI Value')
                ax.set_title(f'{location_name} - Water Bodies (NDWI)\n{results["image_date"]}',
                           fontsize=14, fontweight='bold')
                ax.axis('off')
                
                path = OUTPUT_DIR / f"{safe_name}_ndwi.png"
                plt.savefig(path, dpi=150, bbox_inches='tight')
                plt.close(fig)
                viz_paths['NDWI'] = str(path)
            
            # 4. NDBI Heatmap (Urban)
            if 'ndbi' in indices:
                fig, ax = plt.subplots(figsize=(10, 8))
                im = ax.imshow(indices['ndbi'], cmap='Reds', vmin=-0.5, vmax=1.0)
                plt.colorbar(im, ax=ax, label='NDBI Value')
                ax.set_title(f'{location_name} - Built-up Areas (NDBI)\n{results["image_date"]}',
                           fontsize=14, fontweight='bold')
                ax.axis('off')
                
                path = OUTPUT_DIR / f"{safe_name}_ndbi.png"
                plt.savefig(path, dpi=150, bbox_inches='tight')
                plt.close(fig)
                viz_paths['NDBI'] = str(path)
            
            # 5. Multi-panel comparison
            fig, axes = plt.subplots(2, 2, figsize=(14, 12))
            fig.suptitle(f'{location_name} - Multi-Index Analysis\n{results["image_date"]}',
                        fontsize=16, fontweight='bold')
            
            # RGB
            if image.data.ndim == 3 and image.data.shape[2] >= 3:
                rgb = self._create_rgb_composite(image.data)
                axes[0, 0].imshow(rgb)
                axes[0, 0].set_title('RGB Composite')
                axes[0, 0].axis('off')
            
            # NDVI
            if 'ndvi' in indices:
                im1 = axes[0, 1].imshow(indices['ndvi'], cmap='RdYlGn', vmin=-0.2, vmax=1.0)
                axes[0, 1].set_title(f'NDVI (Vegetation)\nMean: {results["indices"]["ndvi"]["mean"]:.3f}')
                axes[0, 1].axis('off')
                plt.colorbar(im1, ax=axes[0, 1], fraction=0.046)
            
            # NDWI
            if 'ndwi' in indices:
                im2 = axes[1, 0].imshow(indices['ndwi'], cmap='Blues', vmin=-0.5, vmax=1.0)
                axes[1, 0].set_title(f'NDWI (Water)\nMean: {results["indices"]["ndwi"]["mean"]:.3f}')
                axes[1, 0].axis('off')
                plt.colorbar(im2, ax=axes[1, 0], fraction=0.046)
            
            # NDBI
            if 'ndbi' in indices:
                im3 = axes[1, 1].imshow(indices['ndbi'], cmap='Reds', vmin=-0.5, vmax=1.0)
                axes[1, 1].set_title(f'NDBI (Built-up)\nMean: {results["indices"]["ndbi"]["mean"]:.3f}')
                axes[1, 1].axis('off')
                plt.colorbar(im3, ax=axes[1, 1], fraction=0.046)
            
            plt.tight_layout()
            path = OUTPUT_DIR / f"{safe_name}_multi_index.png"
            plt.savefig(path, dpi=150, bbox_inches='tight')
            plt.close(fig)
            viz_paths['Multi-Index'] = str(path)
            
            return viz_paths
            
        except Exception as e:
            print_error(f"Visualization generation failed: {e}")
            import traceback
            traceback.print_exc()
            return viz_paths
    
    def _create_rgb_composite(self, image_data):
        """Create RGB composite"""
        if image_data.ndim == 3 and image_data.shape[2] >= 3:
            # Sentinel-2: B04 (Red), B03 (Green), B02 (Blue)
            rgb = image_data[:, :, [2, 1, 0]]
            # Normalize
            rgb = np.clip(rgb * 2.5, 0, 1)  # Brightness adjustment
            return rgb
        return None
    
    def generate_comparison_chart(self):
        """Generate comparison chart for all locations"""
        print_section("Generating Comparison Chart")
        
        if not self.results:
            print_error("No results to compare")
            return
        
        try:
            locations = list(self.results.keys())
            
            # Prepare data
            ndvi_values = [self.results[loc]['indices'].get('ndvi', {}).get('mean', 0) 
                          for loc in locations]
            ndwi_values = [self.results[loc]['indices'].get('ndwi', {}).get('mean', 0) 
                          for loc in locations]
            ndbi_values = [self.results[loc]['indices'].get('ndbi', {}).get('mean', 0) 
                          for loc in locations]
            health_scores = [self.results[loc]['health_score'] for loc in locations]
            
            # Create comparison chart
            fig, axes = plt.subplots(2, 2, figsize=(16, 12))
            fig.suptitle('Multi-Location Environmental Analysis Comparison', 
                        fontsize=16, fontweight='bold')
            
            # NDVI comparison
            axes[0, 0].bar(locations, ndvi_values, color='green', alpha=0.7)
            axes[0, 0].set_title('Vegetation Health (NDVI)', fontweight='bold')
            axes[0, 0].set_ylabel('NDVI Value')
            axes[0, 0].set_ylim(0, 1)
            axes[0, 0].grid(axis='y', alpha=0.3)
            for i, v in enumerate(ndvi_values):
                axes[0, 0].text(i, v + 0.02, f'{v:.3f}', ha='center', fontweight='bold')
            
            # NDWI comparison
            axes[0, 1].bar(locations, ndwi_values, color='blue', alpha=0.7)
            axes[0, 1].set_title('Water Presence (NDWI)', fontweight='bold')
            axes[0, 1].set_ylabel('NDWI Value')
            axes[0, 1].set_ylim(-0.5, 1)
            axes[0, 1].grid(axis='y', alpha=0.3)
            for i, v in enumerate(ndwi_values):
                axes[0, 1].text(i, v + 0.02, f'{v:.3f}', ha='center', fontweight='bold')
            
            # NDBI comparison
            axes[1, 0].bar(locations, ndbi_values, color='red', alpha=0.7)
            axes[1, 0].set_title('Urbanization (NDBI)', fontweight='bold')
            axes[1, 0].set_ylabel('NDBI Value')
            axes[1, 0].set_ylim(0, 1)
            axes[1, 0].grid(axis='y', alpha=0.3)
            for i, v in enumerate(ndbi_values):
                axes[1, 0].text(i, v + 0.02, f'{v:.3f}', ha='center', fontweight='bold')
            
            # Health score comparison
            colors = ['green' if s > 60 else 'orange' if s > 40 else 'red' for s in health_scores]
            axes[1, 1].bar(locations, health_scores, color=colors, alpha=0.7)
            axes[1, 1].set_title('Environmental Health Score', fontweight='bold')
            axes[1, 1].set_ylabel('Health Score (0-100)')
            axes[1, 1].set_ylim(0, 100)
            axes[1, 1].grid(axis='y', alpha=0.3)
            for i, v in enumerate(health_scores):
                axes[1, 1].text(i, v + 2, f'{v:.1f}', ha='center', fontweight='bold')
            
            plt.tight_layout()
            path = OUTPUT_DIR / "comparison_chart.png"
            plt.savefig(path, dpi=150, bbox_inches='tight')
            plt.close(fig)
            
            print_success(f"Comparison chart saved: {path}")
            
        except Exception as e:
            print_error(f"Failed to generate comparison chart: {e}")
            import traceback
            traceback.print_exc()
    
    async def analyze_all_locations(self, days_back=60):
        """Analyze all test locations"""
        print_header("🛰️  MULTI-LOCATION ENVIRONMENTAL ANALYSIS")
        print(f"📍 Locations: {', '.join(LOCATIONS.keys())}")
        print(f"📅 Search range: Last {days_back} days")
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print_info(f"Output directory: {OUTPUT_DIR.absolute()}")
        
        for location_name, location_data in LOCATIONS.items():
            result = await self.analyze_location(location_name, location_data, days_back)
            if result:
                print_success(f"✅ {location_name} - Analysis complete")
            else:
                print_error(f"❌ {location_name} - Analysis failed")
        
        # Generate comparison chart
        if len(self.results) > 1:
            self.generate_comparison_chart()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print final summary"""
        print_header("📊 ANALYSIS SUMMARY")
        
        if not self.results:
            print_error("No successful analyses")
            return
        
        for location_name, result in self.results.items():
            print(f"\n🗺️  {location_name}")
            print(f"   • Description: {result['description']}")
            print(f"   • Image Date: {result['image_date']}")
            print(f"   • Health Score: {result['health_score']:.1f}/100")
            print(f"   • Dominant Feature: {result['dominant_feature']}")
            print(f"   • Assessment: {result['assessment']}")
            print(f"   • Visualizations: {len(result.get('visualizations', {}))}")
        
        print(f"\n📁 All results saved to: {OUTPUT_DIR.absolute()}")
        print(f"📸 Total visualizations: {sum(len(r.get('visualizations', {})) for r in self.results.values())}")
        print(f"\n⏰ Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


async def main():
    """Run multi-location analysis"""
    analyzer = MultiLocationAnalyzer()
    await analyzer.analyze_all_locations(days_back=60)


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

