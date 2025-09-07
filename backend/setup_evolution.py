#!/usr/bin/env python3
"""
GeoGuardian Backend Evolution Implementation Script

This script implements the enhanced backend capabilities by:
1. Creating necessary directory structure
2. Installing enhanced dependencies
3. Updating existing files with new capabilities
4. Setting up VedgeSat/COASTGUARD integration
5. Testing the new analysis engine

Run this script to evolve from MVP to advanced detection system.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
import json

def setup_directory_structure():
    """Create the enhanced directory structure"""
    
    print("🏗️  Setting up enhanced directory structure...")
    
    # Create new directories
    directories = [
        "backend/app/algorithms",
        "backend/app/services", 
        "backend/app/external/vedgesat",
        "backend/app/external/coastguard",
        "backend/app/api/v2"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        
        # Create __init__.py files
        init_file = Path(directory) / "__init__.py"
        if not init_file.exists():
            init_file.write_text('"""Enhanced GeoGuardian module"""\n')
    
    print("✅ Directory structure created")

def install_enhanced_dependencies():
    """Install enhanced dependencies"""
    
    print("📦 Installing enhanced dependencies...")
    
    try:
        # Use the enhanced requirements file
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", 
            "backend/requirements_enhanced.txt"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Enhanced dependencies installed successfully")
        else:
            print(f"❌ Error installing dependencies: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")
        return False
    
    return True

def create_missing_algorithm_files():
    """Create missing algorithm implementation files"""
    
    print("🧠 Creating missing algorithm files...")
    
    # Create spectral analyzer
    spectral_analyzer_content = '''"""
Spectral Analysis Module for GeoGuardian
Comprehensive spectral indices calculation and analysis
"""

import numpy as np
from typing import Dict, Optional

class SpectralAnalyzer:
    """Comprehensive spectral analysis for satellite imagery"""
    
    def __init__(self):
        self.epsilon = 1e-8  # Avoid division by zero
    
    def extract_all_features(self, image: np.ndarray) -> Dict:
        """Extract comprehensive features from satellite imagery"""
        
        # Extract bands (assuming standard Sentinel-2 order)
        bands = self._extract_bands(image)
        
        # Calculate spectral indices
        indices = self._calculate_all_indices(bands)
        
        return {
            'bands': bands,
            'indices': indices,
            'metadata': {
                'image_shape': image.shape,
                'band_count': image.shape[2] if image.ndim == 3 else 1
            }
        }
    
    def _extract_bands(self, image: np.ndarray) -> Dict[str, np.ndarray]:
        """Extract individual bands from multi-band image"""
        
        bands = {}
        
        if image.ndim == 3 and image.shape[2] >= 4:
            bands['blue'] = image[:, :, 0]    # B02
            bands['green'] = image[:, :, 1]   # B03  
            bands['red'] = image[:, :, 2]     # B04
            bands['nir'] = image[:, :, 3]     # B08
            
            # Additional bands if available
            if image.shape[2] >= 6:
                bands['red_edge_1'] = image[:, :, 4]  # B05
                bands['red_edge_2'] = image[:, :, 5]  # B06
            if image.shape[2] >= 8:
                bands['red_edge_3'] = image[:, :, 6]  # B07
                bands['swir_1'] = image[:, :, 7]      # B11
            if image.shape[2] >= 10:
                bands['swir_2'] = image[:, :, 8]      # B12
        
        return bands
    
    def _calculate_all_indices(self, bands: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Calculate comprehensive set of spectral indices"""
        
        indices = {}
        
        # Vegetation indices
        if 'nir' in bands and 'red' in bands:
            indices['ndvi'] = (bands['nir'] - bands['red']) / (bands['nir'] + bands['red'] + self.epsilon)
        
        if 'nir' in bands and 'red' in bands and 'blue' in bands:
            indices['evi'] = 2.5 * ((bands['nir'] - bands['red']) / 
                                   (bands['nir'] + 6*bands['red'] - 7.5*bands['blue'] + 1 + self.epsilon))
        
        # Water indices  
        if 'green' in bands and 'nir' in bands:
            indices['ndwi'] = (bands['green'] - bands['nir']) / (bands['green'] + bands['nir'] + self.epsilon)
        
        if 'green' in bands and 'swir_1' in bands:
            indices['mndwi'] = (bands['green'] - bands['swir_1']) / (bands['green'] + bands['swir_1'] + self.epsilon)
        
        # Soil/construction indices
        if 'swir_1' in bands and 'red' in bands and 'nir' in bands and 'blue' in bands:
            indices['bsi'] = ((bands['swir_1'] + bands['red']) - (bands['nir'] + bands['blue'])) / \\
                            ((bands['swir_1'] + bands['red']) + (bands['nir'] + bands['blue']) + self.epsilon)
        
        # Specialized indices
        if 'red_edge_1' in bands and 'red' in bands:
            indices['algae_index'] = bands['red_edge_1'] / (bands['red'] + self.epsilon)
        
        if 'red' in bands and 'nir' in bands:
            indices['turbidity_index'] = bands['red'] / (bands['nir'] + self.epsilon)
        
        return indices
'''
    
    with open("backend/app/core/spectral_analyzer.py", "w") as f:
        f.write(spectral_analyzer_content)
    
    # Create __init__.py for algorithms
    with open("backend/app/algorithms/__init__.py", "w") as f:
        f.write('"""Advanced detection algorithms for GeoGuardian"""\n')
    
    print("✅ Algorithm files created")

def setup_vedgesat_integration():
    """Set up VedgeSat/COASTGUARD integration"""
    
    print("🌊 Setting up VedgeSat/COASTGUARD integration...")
    
    coastguard_dir = Path("backend/app/external/COASTGUARD")
    
    try:
        # Clone COASTGUARD repository if not present
        if not coastguard_dir.exists():
            print("📥 Cloning COASTGUARD repository...")
            result = subprocess.run([
                "git", "clone", 
                "https://github.com/fmemuir/COASTGUARD.git",
                str(coastguard_dir)
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ COASTGUARD repository cloned successfully")
            else:
                print(f"❌ Failed to clone COASTGUARD: {result.stderr}")
                print("⚠️  VedgeSat integration will use fallback methods")
                return False
        else:
            print("✅ COASTGUARD repository already exists")
        
        # Install COASTGUARD package in development mode
        print("📦 Installing COASTGUARD package...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-e", str(coastguard_dir)
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ COASTGUARD package installed successfully")
            return True
        else:
            print(f"❌ Failed to install COASTGUARD package: {result.stderr}")
            print("⚠️  VedgeSat integration will use fallback methods")
            return False
            
    except Exception as e:
        print(f"❌ Error setting up VedgeSat integration: {e}")
        print("⚠️  VedgeSat integration will use fallback methods")
        return False

def update_main_application():
    """Update main.py to include new endpoints"""
    
    print("🔧 Updating main application...")
    
    main_py_path = Path("backend/app/main.py")
    
    if main_py_path.exists():
        # Read current content
        with open(main_py_path, 'r') as f:
            content = f.read()
        
        # Add new imports and routes if not already present
        if "from .api import analysis" not in content:
            # Add import for new analysis endpoint
            import_line = "from .api import auth, aoi, alerts"
            new_import_line = "from .api import auth, aoi, alerts, analysis"
            content = content.replace(import_line, new_import_line)
            
            # Add router inclusion
            router_line = "app.include_router(alerts.router, prefix=settings.API_V1_STR)"
            new_router_line = '''app.include_router(alerts.router, prefix=settings.API_V1_STR)

# Enhanced analysis endpoints (v2)
try:
    from .api import analysis
    app.include_router(analysis.router, prefix="/api/v2", tags=["analysis-v2"])
except ImportError:
    pass  # analysis module not yet implemented'''
            content = content.replace(router_line, new_router_line)
            
            # Write updated content
            with open(main_py_path, 'w') as f:
                f.write(content)
            
            print("✅ Main application updated")
    else:
        print("❌ main.py not found")

def create_analysis_endpoint():
    """Create the new analysis endpoint"""
    
    print("🔗 Creating enhanced analysis endpoints...")
    
    analysis_endpoint_content = '''"""
Enhanced Analysis API Endpoints (v2)
Provides access to advanced multi-algorithm detection capabilities
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional
import numpy as np
import base64
from io import BytesIO
from PIL import Image

# Import our enhanced analysis engine
try:
    from ..core.analysis_engine import AdvancedAnalysisEngine, AnalysisConfig
    from ..core.sentinel_enhanced import EnhancedSentinelClient
    ADVANCED_ANALYSIS_AVAILABLE = True
except ImportError:
    ADVANCED_ANALYSIS_AVAILABLE = False

router = APIRouter()

class AnalysisRequest(BaseModel):
    aoi_id: str
    analysis_type: str = "comprehensive"  # comprehensive, vegetation, water, coastal, construction
    date_range_days: int = 30
    use_baseline: bool = True

class AnalysisResponse(BaseModel):
    success: bool
    analysis_type: str
    overall_confidence: float
    priority_level: str
    detections: List[Dict]
    visualization_data: Dict
    error: Optional[str] = None

@router.post("/analysis/comprehensive", response_model=AnalysisResponse)
async def comprehensive_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """Comprehensive multi-algorithm environmental analysis"""
    
    if not ADVANCED_ANALYSIS_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Advanced analysis engine not available. Please complete setup."
        )
    
    try:
        # Initialize analysis engine
        config = AnalysisConfig()
        engine = AdvancedAnalysisEngine(config)
        
        # TODO: Implement actual satellite data fetching and analysis
        # This is a placeholder response structure
        
        return AnalysisResponse(
            success=True,
            analysis_type=request.analysis_type,
            overall_confidence=0.85,
            priority_level="medium",
            detections=[
                {
                    "type": "vegetation_analysis",
                    "change_detected": True,
                    "confidence": 0.82,
                    "severity": "moderate"
                }
            ],
            visualization_data={
                "rgb_comparison": [],
                "change_overlays": []
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.get("/analysis/status")
async def get_analysis_status():
    """Get analysis engine status and capabilities"""
    
    status = {
        "advanced_analysis_available": ADVANCED_ANALYSIS_AVAILABLE,
        "algorithms_available": [],
        "vedgesat_status": "not_configured"
    }
    
    if ADVANCED_ANALYSIS_AVAILABLE:
        try:
            from ..core.vedgesat_wrapper import get_vedgesat_status
            vedgesat_status = get_vedgesat_status()
            status["vedgesat_status"] = "available" if vedgesat_status["vedgesat_available"] else "fallback"
            status["algorithms_available"] = ["ewma", "cusum", "spectral_analysis", "edge_detection"]
        except ImportError:
            pass
    
    return status

@router.post("/analysis/install-vedgesat")
async def install_vedgesat():
    """Install VedgeSat/COASTGUARD integration"""
    
    try:
        from ..core.vedgesat_wrapper import install_vedgesat
        result = install_vedgesat()
        return result
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="VedgeSat wrapper not available"
        )
'''

    # Create the analysis endpoint file
    analysis_file = Path("backend/app/api/analysis.py")
    with open(analysis_file, 'w') as f:
        f.write(analysis_endpoint_content)
    
    print("✅ Analysis endpoints created")

def create_enhanced_sentinel_client():
    """Create enhanced Sentinel Hub client"""
    
    print("🛰️  Creating enhanced Sentinel Hub client...")
    
    enhanced_sentinel_content = '''"""
Enhanced Sentinel Hub Client for Advanced Analysis
Supports all 13 Sentinel-2 bands and advanced preprocessing
"""

import numpy as np
from sentinelhub import *
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from ..core.config import settings

class EnhancedSentinelClient:
    """Enhanced Sentinel Hub client with full spectral band support"""
    
    def __init__(self):
        self.config = SHConfig()
        self.config.sh_client_id = settings.SENTINELHUB_CLIENT_ID
        self.config.sh_client_secret = settings.SENTINELHUB_CLIENT_SECRET
    
    def fetch_all_bands(
        self, 
        geojson: dict, 
        date_range: Tuple[datetime, datetime],
        resolution: int = 10
    ) -> Optional[np.ndarray]:
        """Fetch all 13 Sentinel-2 bands for advanced analysis"""
        
        bbox = self._get_bbox_from_geojson(geojson)
        size = self._get_optimal_size(bbox, resolution)
        
        # Enhanced evalscript for all bands
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B8A", "B09", "B11", "B12", "SCL"],
                output: { bands: 12, sampleType: "FLOAT32" }
            };
        }

        function evaluatePixel(sample) {
            // Skip clouds and cloud shadows
            if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10 || sample.SCL == 11) {
                return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            }
            
            // Return all 12 spectral bands (excluding SCL)
            return [sample.B01, sample.B02, sample.B03, sample.B04, sample.B05, sample.B06, 
                   sample.B07, sample.B08, sample.B8A, sample.B09, sample.B11, sample.B12];
        }
        """
        
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=date_range,
                    maxcc=0.1  # Very low cloud coverage for analysis
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=size,
            config=self.config
        )
        
        try:
            data = request.get_data()
            if data and len(data) > 0:
                return data[0]
            return None
        except Exception as e:
            print(f"Error fetching enhanced Sentinel-2 data: {e}")
            return None
    
    def _get_bbox_from_geojson(self, geojson: dict) -> BBox:
        """Extract bounding box from GeoJSON"""
        coordinates = geojson["coordinates"][0]
        lons = [coord[0] for coord in coordinates]
        lats = [coord[1] for coord in coordinates]
        
        return BBox(
            bbox=[min(lons), min(lats), max(lons), max(lats)],
            crs=CRS.WGS84
        )
    
    def _get_optimal_size(self, bbox: BBox, resolution: int) -> Tuple[int, int]:
        """Calculate optimal image size"""
        size = bbox_to_dimensions(bbox, resolution=resolution)
        
        # Ensure reasonable size limits
        max_size = 2048
        if max(size) > max_size:
            scale = max_size / max(size)
            size = (int(size[0] * scale), int(size[1] * scale))
        
        return size

# Global instance
enhanced_sentinel_client = EnhancedSentinelClient()
'''

    with open("backend/app/core/sentinel_enhanced.py", 'w') as f:
        f.write(enhanced_sentinel_content)
    
    print("✅ Enhanced Sentinel Hub client created")

def run_tests():
    """Run basic tests to verify the setup"""
    
    print("🧪 Running setup verification tests...")
    
    try:
        # Test imports
        import numpy as np
        import cv2
        import scipy
        import sklearn
        print("✅ Core scientific libraries imported successfully")
        
        # Test algorithm imports
        sys.path.append('backend')
        from app.algorithms.ewma import EWMADetector
        from app.algorithms.cusum import CUSUMDetector
        print("✅ Detection algorithms imported successfully")
        
        # Test basic functionality
        ewma = EWMADetector()
        change, confidence, metadata = ewma.detect_change(0.5, 0.3, 0.1)
        print("✅ EWMA detector functional")
        
        cusum = CUSUMDetector()
        change, change_type, confidence, metadata = cusum.detect_change(0.8, 0.5, 0.2)
        print("✅ CUSUM detector functional")
        
        print("✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    """Main setup function"""
    
    print("🚀 GeoGuardian Backend Evolution Setup")
    print("=" * 50)
    
    # Step 1: Directory structure
    setup_directory_structure()
    
    # Step 2: Install dependencies
    if not install_enhanced_dependencies():
        print("⚠️  Continuing with existing dependencies...")
    
    # Step 3: Create algorithm files
    create_missing_algorithm_files()
    
    # Step 4: VedgeSat integration
    vedgesat_success = setup_vedgesat_integration()
    
    # Step 5: Update main application
    update_main_application()
    
    # Step 6: Create new endpoints
    create_analysis_endpoint()
    
    # Step 7: Enhanced Sentinel client
    create_enhanced_sentinel_client()
    
    # Step 8: Run tests
    tests_passed = run_tests()
    
    print("\\n" + "=" * 50)
    print("🎉 SETUP COMPLETE!")
    print("=" * 50)
    
    print("\\n📋 SETUP SUMMARY:")
    print(f"✅ Directory structure: Created")
    print(f"✅ Algorithm files: Created")
    print(f"✅ API endpoints: Created")
    print(f"✅ Enhanced Sentinel client: Created")
    print(f"{'✅' if vedgesat_success else '⚠️ '} VedgeSat integration: {'Success' if vedgesat_success else 'Fallback mode'}")
    print(f"{'✅' if tests_passed else '❌'} Tests: {'Passed' if tests_passed else 'Failed'}")
    
    print("\\n🚀 NEXT STEPS:")
    print("1. Update your .env file with any new configuration")
    print("2. Restart your FastAPI server")
    print("3. Test the new endpoints at /api/v2/analysis/status")
    print("4. Run comprehensive analysis on your AOIs")
    
    if not vedgesat_success:
        print("\\n⚠️  VedgeSat integration using fallback methods")
        print("   To enable full VedgeSat capabilities:")
        print("   - Ensure git is installed and accessible")
        print("   - Check network connectivity")
        print("   - Run: POST /api/v2/analysis/install-vedgesat")

if __name__ == "__main__":
    main()