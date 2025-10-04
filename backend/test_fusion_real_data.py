"""
Test Multi-Sensor Fusion Engine with Real Sentinel Data
Validates fusion algorithms with actual satellite imagery from different scenarios
"""

import os
import sys
import numpy as np
from datetime import datetime, timedelta
import json
import logging

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.analysis_engine import AdvancedAnalysisEngine, AnalysisConfig
from app.core.satellite_data import SatelliteDataManager
from app.core.fusion_engine import ChangeCategory

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Test scenarios with known ground truth
TEST_SCENARIOS = {
    'construction_site': {
        'name': 'Construction Activity Test',
        'coordinates': [91.7362, 26.1445],  # Guwahati construction zone
        'expected_category': ChangeCategory.ILLEGAL_CONSTRUCTION,
        'description': 'Active construction zone with building development'
    },
    'agricultural_area': {
        'name': 'Agricultural Seasonal Change Test',
        'coordinates': [88.3639, 22.5726],  # Kolkata agricultural outskirts
        'expected_category': ChangeCategory.SEASONAL_AGRICULTURE,
        'description': 'Agricultural area with seasonal cropping patterns'
    },
    'water_body': {
        'name': 'Water Quality Test',
        'coordinates': [88.3639, 22.5726],  # River near Kolkata
        'expected_category': ChangeCategory.WATER_POLLUTION,
        'description': 'Water body susceptible to pollution'
    },
    'forest_area': {
        'name': 'Vegetation Loss Test',
        'coordinates': [91.7595, 26.1525],  # Forest area near Guwahati
        'expected_category': ChangeCategory.DEFORESTATION,
        'description': 'Forest area monitoring for deforestation'
    }
}


def create_test_aoi(center_lon: float, center_lat: float, size_km: float = 1.0) -> dict:
    """
    Create a square AOI GeoJSON around a center point
    
    Args:
        center_lon: Center longitude
        center_lat: Center latitude
        size_km: Size of the square in kilometers
        
    Returns:
        GeoJSON polygon
    """
    # Approximate degree offset for the size
    # 1 degree latitude ≈ 111 km
    # 1 degree longitude varies with latitude
    lat_offset = size_km / 111.0
    lon_offset = size_km / (111.0 * np.cos(np.radians(center_lat)))
    
    coordinates = [
        [
            [center_lon - lon_offset, center_lat - lat_offset],
            [center_lon + lon_offset, center_lat - lat_offset],
            [center_lon + lon_offset, center_lat + lat_offset],
            [center_lon - lon_offset, center_lat + lat_offset],
            [center_lon - lon_offset, center_lat - lat_offset]  # Close polygon
        ]
    ]
    
    return {
        'type': 'Polygon',
        'coordinates': coordinates
    }


def test_fusion_with_real_data():
    """
    Test fusion engine with real Sentinel data
    """
    
    print("=" * 80)
    print("MULTI-SENSOR FUSION ENGINE TEST WITH REAL DATA")
    print("=" * 80)
    print()
    
    # Initialize components
    print("Initializing analysis engine...")
    config = AnalysisConfig(
        baseline_years=1,
        confidence_threshold=0.7,
        enable_vedgesat=False,  # Disable for simplicity
        enable_all_algorithms=True
    )
    analysis_engine = AdvancedAnalysisEngine(config)
    satellite_manager = SatelliteDataManager()
    
    print(f"✓ Analysis engine initialized")
    print(f"✓ Satellite manager ready")
    print()
    
    # Test each scenario
    results_summary = []
    
    for scenario_id, scenario in TEST_SCENARIOS.items():
        print("-" * 80)
        print(f"TEST: {scenario['name']}")
        print(f"Description: {scenario['description']}")
        print(f"Expected Category: {scenario['expected_category'].value}")
        print("-" * 80)
        
        try:
            # Create AOI
            geojson = create_test_aoi(
                scenario['coordinates'][0],
                scenario['coordinates'][1],
                size_km=0.5  # Smaller AOI for faster processing
            )
            
            # Get before and after images
            print(f"Fetching satellite imagery...")
            
            # Get recent image (after)
            after_date = datetime.now()
            after_response = satellite_manager.get_satellite_data(
                geojson,
                start_date=after_date - timedelta(days=7),
                end_date=after_date,
                max_cloud_coverage=30
            )
            
            if not after_response.get('success'):
                print(f"✗ Failed to fetch recent imagery: {after_response.get('error')}")
                continue
            
            after_image = after_response['image']
            print(f"✓ Recent image retrieved: {after_image.shape}")
            
            # Get baseline image (before) - 3 months ago
            before_date = datetime.now() - timedelta(days=90)
            before_response = satellite_manager.get_satellite_data(
                geojson,
                start_date=before_date - timedelta(days=7),
                end_date=before_date,
                max_cloud_coverage=30
            )
            
            if not before_response.get('success'):
                print(f"✗ Failed to fetch baseline imagery: {before_response.get('error')}")
                continue
            
            before_image = before_response['image']
            print(f"✓ Baseline image retrieved: {before_image.shape}")
            
            # Run comprehensive analysis with fusion
            print(f"\nRunning multi-sensor fusion analysis...")
            analysis_results = analysis_engine.analyze_environmental_change(
                before_image=before_image,
                after_image=after_image,
                geojson=geojson,
                analysis_type='comprehensive',
                baseline_data=None  # Let it calculate baseline
            )
            
            # Extract fusion results
            fusion = analysis_results.get('fusion_analysis', {})
            
            if fusion:
                print(f"\n{'=' * 60}")
                print(f"FUSION ANALYSIS RESULTS")
                print(f"{'=' * 60}")
                print(f"Category Detected: {fusion.get('category', 'unknown')}")
                print(f"Risk Level: {fusion.get('risk_level', 'unknown').upper()}")
                print(f"Composite Risk Score: {fusion.get('composite_risk_score', 0):.3f}")
                print(f"Confidence: {fusion.get('confidence', 0):.1%}")
                print(f"Seasonal Likelihood: {fusion.get('seasonal_likelihood', 0):.1%}")
                print(f"\nPrimary Indicators:")
                for indicator in fusion.get('primary_indicators', []):
                    print(f"  • {indicator}")
                print(f"\nRecommendation:")
                print(f"  {fusion.get('recommendation', 'N/A')}")
                print(f"{'=' * 60}")
                
                # Check if detected category matches expected
                detected_category = fusion.get('category', 'unknown')
                expected_category = scenario['expected_category'].value
                
                match = detected_category == expected_category
                match_str = "✓ MATCH" if match else "✗ MISMATCH"
                
                results_summary.append({
                    'scenario': scenario['name'],
                    'expected': expected_category,
                    'detected': detected_category,
                    'match': match,
                    'confidence': fusion.get('confidence', 0),
                    'risk_score': fusion.get('composite_risk_score', 0),
                    'risk_level': fusion.get('risk_level', 'unknown')
                })
                
                print(f"\nCategory Match: {match_str}")
                print(f"Expected: {expected_category}")
                print(f"Detected: {detected_category}")
                
            else:
                print(f"✗ No fusion analysis results returned")
                results_summary.append({
                    'scenario': scenario['name'],
                    'expected': scenario['expected_category'].value,
                    'detected': 'error',
                    'match': False,
                    'error': 'No fusion results'
                })
            
            # Print other detection results
            print(f"\nOther Detection Results:")
            for detection in analysis_results.get('detections', []):
                det_type = detection.get('type', 'unknown')
                change_detected = detection.get('change_detected', False)
                confidence = detection.get('confidence', 0)
                print(f"  • {det_type}: {'CHANGE' if change_detected else 'STABLE'} (confidence: {confidence:.1%})")
            
            print(f"\nOverall Confidence: {analysis_results.get('overall_confidence', 0):.1%}")
            print(f"Priority Level: {analysis_results.get('priority_level', 'unknown').upper()}")
            
        except Exception as e:
            logger.error(f"Error testing scenario {scenario_id}: {e}", exc_info=True)
            results_summary.append({
                'scenario': scenario['name'],
                'expected': scenario['expected_category'].value,
                'detected': 'error',
                'match': False,
                'error': str(e)
            })
        
        print()
    
    # Print summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print()
    
    total_tests = len(results_summary)
    successful_matches = sum(1 for r in results_summary if r.get('match', False))
    success_rate = (successful_matches / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Successful Matches: {successful_matches}")
    print(f"Success Rate: {success_rate:.1f}%")
    print()
    
    print("Detailed Results:")
    print("-" * 80)
    for result in results_summary:
        status = "✓ PASS" if result.get('match') else "✗ FAIL"
        print(f"{status} | {result['scenario']}")
        print(f"       Expected: {result['expected']}")
        print(f"       Detected: {result['detected']}")
        if 'confidence' in result:
            print(f"       Confidence: {result['confidence']:.1%}")
            print(f"       Risk Score: {result['risk_score']:.3f}")
            print(f"       Risk Level: {result['risk_level'].upper()}")
        if 'error' in result:
            print(f"       Error: {result['error']}")
        print()
    
    # Save results to file
    results_file = f"fusion_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump({
            'test_date': datetime.now().isoformat(),
            'success_rate': success_rate,
            'total_tests': total_tests,
            'successful_matches': successful_matches,
            'results': results_summary
        }, f, indent=2)
    
    print(f"Results saved to: {results_file}")
    print()
    
    return success_rate >= 50  # Consider test passing if 50%+ accuracy


if __name__ == "__main__":
    try:
        success = test_fusion_with_real_data()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Test failed with error: {e}", exc_info=True)
        sys.exit(1)
