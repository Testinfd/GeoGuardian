"""
Advanced Visualization Module
Generates heat maps, change intensity visualizations, and other analytical graphics
"""

import numpy as np
import io
import base64
from typing import Dict, Optional, Tuple
from PIL import Image
from matplotlib import pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import logging

logger = logging.getLogger(__name__)


class ChangeVisualizer:
    """Generate advanced visualizations for change detection analysis"""
    
    def __init__(self):
        # Define custom colormaps
        self.colormaps = {
            'change_intensity': self._create_change_colormap(),
            'risk': self._create_risk_colormap(),
            'vegetation': 'RdYlGn',  # Red-Yellow-Green
            'water': 'Blues',
            'thermal': 'hot'
        }
    
    def generate_change_heatmap(
        self,
        before_image: np.ndarray,
        after_image: np.ndarray,
        colormap: str = 'change_intensity',
        title: str = 'Environmental Change Heat Map',
        show_colorbar: bool = True
    ) -> str:
        """
        Generate a heat map showing change intensity
        
        Args:
            before_image: Image from earlier date
            after_image: Image from later date
            colormap: Name of colormap to use
            title: Title for the heatmap
            show_colorbar: Whether to show colorbar
            
        Returns:
            Base64 encoded PNG image string
        """
        
        try:
            # Calculate change
            change = self._calculate_change_magnitude(before_image, after_image)
            
            # Normalize to 0-1
            change_norm = self._normalize_array(change)
            
            # Create figure
            fig, ax = plt.subplots(figsize=(12, 10))
            
            # Get colormap
            cmap = self._get_colormap(colormap)
            
            # Create heatmap
            im = ax.imshow(change_norm, cmap=cmap, interpolation='bilinear', aspect='auto')
            
            # Add colorbar
            if show_colorbar:
                cbar = plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
                cbar.set_label('Change Intensity', rotation=270, labelpad=20, fontsize=12)
            
            # Add title
            ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
            ax.axis('off')
            
            # Convert to base64
            img_base64 = self._figure_to_base64(fig)
            plt.close(fig)
            
            return img_base64
            
        except Exception as e:
            logger.error(f"Error generating heatmap: {e}")
            return self._generate_error_image("Heatmap generation failed")
    
    def generate_multi_index_heatmap(
        self,
        indices_before: Dict[str, np.ndarray],
        indices_after: Dict[str, np.ndarray],
        index_names: Optional[list] = None
    ) -> str:
        """
        Generate a multi-panel heatmap showing changes in multiple indices
        
        Args:
            indices_before: Dictionary of spectral indices (before)
            indices_after: Dictionary of spectral indices (after)
            index_names: Optional list of specific indices to show
            
        Returns:
            Base64 encoded PNG image string
        """
        
        try:
            # Select indices to visualize
            if index_names is None:
                index_names = list(set(indices_before.keys()) & set(indices_after.keys()))
                index_names = index_names[:6]  # Limit to 6 panels
            
            n_indices = len(index_names)
            if n_indices == 0:
                return self._generate_error_image("No indices to display")
            
            # Calculate grid layout
            n_cols = min(3, n_indices)
            n_rows = (n_indices + n_cols - 1) // n_cols
            
            # Create figure
            fig, axes = plt.subplots(n_rows, n_cols, figsize=(5*n_cols, 4*n_rows))
            
            if n_indices == 1:
                axes = np.array([axes])
            axes = axes.flatten()
            
            # Plot each index
            for idx, index_name in enumerate(index_names):
                if index_name not in indices_before or index_name not in indices_after:
                    continue
                
                # Calculate change
                change = indices_after[index_name] - indices_before[index_name]
                change_norm = self._normalize_array(np.abs(change))
                
                # Plot
                im = axes[idx].imshow(
                    change_norm,
                    cmap='RdYlBu_r',
                    interpolation='bilinear',
                    aspect='auto'
                )
                
                axes[idx].set_title(index_name.upper(), fontsize=12, fontweight='bold')
                axes[idx].axis('off')
                
                # Add colorbar
                plt.colorbar(im, ax=axes[idx], fraction=0.046, pad=0.04)
            
            # Hide unused subplots
            for idx in range(n_indices, len(axes)):
                axes[idx].axis('off')
            
            plt.tight_layout()
            
            # Convert to base64
            img_base64 = self._figure_to_base64(fig)
            plt.close(fig)
            
            return img_base64
            
        except Exception as e:
            logger.error(f"Error generating multi-index heatmap: {e}")
            return self._generate_error_image("Multi-index heatmap generation failed")
    
    def generate_comparison_view(
        self,
        before_image: np.ndarray,
        after_image: np.ndarray,
        change_map: Optional[np.ndarray] = None,
        labels: Tuple[str, str, str] = ('Before', 'After', 'Change')
    ) -> str:
        """
        Generate side-by-side comparison with optional change map
        
        Args:
            before_image: Image from earlier date
            after_image: Image from later date
            change_map: Optional change map
            labels: Tuple of labels for (before, after, change)
            
        Returns:
            Base64 encoded PNG image string
        """
        
        try:
            # Determine number of panels
            n_panels = 3 if change_map is not None else 2
            
            # Create figure
            fig, axes = plt.subplots(1, n_panels, figsize=(6*n_panels, 6))
            
            if n_panels == 2:
                axes = [axes[0], axes[1]]
            
            # Prepare images for display
            before_rgb = self._prepare_rgb(before_image)
            after_rgb = self._prepare_rgb(after_image)
            
            # Plot before
            axes[0].imshow(before_rgb)
            axes[0].set_title(labels[0], fontsize=14, fontweight='bold')
            axes[0].axis('off')
            
            # Plot after
            axes[1].imshow(after_rgb)
            axes[1].set_title(labels[1], fontsize=14, fontweight='bold')
            axes[1].axis('off')
            
            # Plot change map if provided
            if change_map is not None and n_panels == 3:
                change_norm = self._normalize_array(change_map)
                im = axes[2].imshow(change_norm, cmap='RdYlBu_r', interpolation='bilinear')
                axes[2].set_title(labels[2], fontsize=14, fontweight='bold')
                axes[2].axis('off')
                plt.colorbar(im, ax=axes[2], fraction=0.046, pad=0.04)
            
            plt.tight_layout()
            
            # Convert to base64
            img_base64 = self._figure_to_base64(fig)
            plt.close(fig)
            
            return img_base64
            
        except Exception as e:
            logger.error(f"Error generating comparison view: {e}")
            return self._generate_error_image("Comparison view generation failed")
    
    def generate_temporal_chart(
        self,
        time_series: list,
        index_name: str,
        title: Optional[str] = None,
        show_trend: bool = True,
        show_forecast: bool = True
    ) -> str:
        """
        Generate temporal analysis chart
        
        Args:
            time_series: List of {'date': datetime, 'value': float} dicts
            index_name: Name of the spectral index
            title: Optional custom title
            show_trend: Whether to show trend line
            show_forecast: Whether to show forecast
            
        Returns:
            Base64 encoded PNG image string
        """
        
        try:
            if not time_series or len(time_series) < 2:
                return self._generate_error_image("Insufficient data for temporal chart")
            
            # Extract dates and values
            dates = [point['date'] for point in time_series]
            values = [point['value'] for point in time_series]
            
            # Create figure
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # Plot main time series
            ax.plot(dates, values, 'o-', linewidth=2, markersize=6, label='Observed', color='#2E86AB')
            
            # Add trend line if requested
            if show_trend and len(values) >= 3:
                from scipy import stats
                x_numeric = np.arange(len(dates))
                slope, intercept, r_value, p_value, std_err = stats.linregress(x_numeric, values)
                trend_line = slope * x_numeric + intercept
                ax.plot(dates, trend_line, '--', linewidth=2, label=f'Trend (R²={r_value**2:.3f})', 
                       color='#A23B72', alpha=0.7)
            
            # Add forecast if requested
            if show_forecast and len(values) >= 3:
                # Simple linear forecast
                from scipy import stats
                x_numeric = np.arange(len(dates))
                slope, intercept, _, _, _ = stats.linregress(x_numeric, values)
                
                # Forecast next 2 periods
                forecast_x = np.arange(len(dates), len(dates) + 2)
                forecast_values = slope * forecast_x + intercept
                
                # Create forecast dates (assuming regular intervals)
                if len(dates) >= 2:
                    from datetime import datetime
                    interval = dates[-1] - dates[-2]
                    forecast_dates = [dates[-1] + interval * (i+1) for i in range(2)]
                    
                    ax.plot(forecast_dates, forecast_values, 's--', linewidth=2, 
                           markersize=6, label='Forecast', color='#F18F01', alpha=0.7)
            
            # Styling
            ax.set_xlabel('Date', fontsize=12, fontweight='bold')
            ax.set_ylabel(index_name.upper(), fontsize=12, fontweight='bold')
            
            if title:
                ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
            else:
                ax.set_title(f'{index_name.upper()} Temporal Analysis', 
                           fontsize=14, fontweight='bold', pad=20)
            
            ax.legend(loc='best', frameon=True, shadow=True)
            ax.grid(True, alpha=0.3, linestyle='--')
            
            # Format dates
            fig.autofmt_xdate()
            
            plt.tight_layout()
            
            # Convert to base64
            img_base64 = self._figure_to_base64(fig)
            plt.close(fig)
            
            return img_base64
            
        except Exception as e:
            logger.error(f"Error generating temporal chart: {e}")
            return self._generate_error_image("Temporal chart generation failed")
    
    def generate_hotspot_overlay(
        self,
        base_image: np.ndarray,
        hotspots: list,
        grid_size: int = 10
    ) -> str:
        """
        Generate visualization with hotspots overlaid on base image
        
        Args:
            base_image: Base satellite image
            hotspots: List of hotspot dictionaries
            grid_size: Grid size used for hotspot detection
            
        Returns:
            Base64 encoded PNG image string
        """
        
        try:
            # Prepare base image
            base_rgb = self._prepare_rgb(base_image)
            
            # Create figure
            fig, ax = plt.subplots(figsize=(12, 10))
            ax.imshow(base_rgb)
            
            # Calculate cell size
            height, width = base_rgb.shape[:2]
            cell_height = height / grid_size
            cell_width = width / grid_size
            
            # Overlay hotspots
            for hotspot in hotspots:
                pos = hotspot['grid_position']
                severity = hotspot.get('severity', 'low')
                
                # Determine color based on severity
                colors = {
                    'critical': 'red',
                    'high': 'orange',
                    'moderate': 'yellow',
                    'low': 'lightblue'
                }
                color = colors.get(severity, 'yellow')
                
                # Calculate rectangle position
                x = pos['col'] * cell_width
                y = pos['row'] * cell_height
                
                # Draw rectangle
                from matplotlib.patches import Rectangle
                rect = Rectangle(
                    (x, y), cell_width, cell_height,
                    linewidth=2, edgecolor=color, facecolor=color,
                    alpha=0.4
                )
                ax.add_patch(rect)
            
            ax.set_title('Change Hotspot Detection', fontsize=14, fontweight='bold', pad=20)
            ax.axis('off')
            
            # Add legend
            from matplotlib.patches import Patch
            legend_elements = [
                Patch(facecolor='red', alpha=0.4, label='Critical'),
                Patch(facecolor='orange', alpha=0.4, label='High'),
                Patch(facecolor='yellow', alpha=0.4, label='Moderate'),
                Patch(facecolor='lightblue', alpha=0.4, label='Low')
            ]
            ax.legend(handles=legend_elements, loc='upper right', frameon=True, shadow=True)
            
            plt.tight_layout()
            
            # Convert to base64
            img_base64 = self._figure_to_base64(fig)
            plt.close(fig)
            
            return img_base64
            
        except Exception as e:
            logger.error(f"Error generating hotspot overlay: {e}")
            return self._generate_error_image("Hotspot overlay generation failed")
    
    # Helper methods
    
    def _calculate_change_magnitude(
        self,
        before: np.ndarray,
        after: np.ndarray
    ) -> np.ndarray:
        """Calculate change magnitude between two images"""
        
        # Handle multi-band images
        if before.ndim == 3:
            change = np.sqrt(np.sum((after - before) ** 2, axis=2))
        else:
            change = np.abs(after - before)
        
        return change
    
    def _normalize_array(self, array: np.ndarray) -> np.ndarray:
        """Normalize array to 0-1 range"""
        
        min_val = np.min(array)
        max_val = np.max(array)
        
        if max_val - min_val < 1e-8:
            return np.zeros_like(array)
        
        return (array - min_val) / (max_val - min_val)
    
    def _prepare_rgb(self, image: np.ndarray) -> np.ndarray:
        """Prepare image for RGB display"""
        
        if image.ndim == 2:
            # Grayscale - convert to RGB
            return np.stack([image, image, image], axis=2)
        
        if image.shape[2] >= 3:
            # Extract RGB bands (assuming B04, B03, B02 order or similar)
            rgb = image[:, :, :3].copy()
        else:
            # Not enough bands
            return np.zeros((*image.shape[:2], 3))
        
        # Normalize to 0-255
        rgb_norm = self._normalize_array(rgb)
        rgb_8bit = (rgb_norm * 255).astype(np.uint8)
        
        return rgb_8bit
    
    def _get_colormap(self, name: str):
        """Get colormap by name"""
        
        if name in self.colormaps:
            cmap = self.colormaps[name]
            if isinstance(cmap, str):
                return plt.get_cmap(cmap)
            return cmap
        
        return plt.get_cmap('viridis')
    
    def _create_change_colormap(self):
        """Create custom colormap for change intensity"""
        
        colors = ['#2E86AB', '#A7D3F5', '#FFFFFF', '#F18F01', '#C73E1D']
        n_bins = 256
        cmap = LinearSegmentedColormap.from_list('change', colors, N=n_bins)
        return cmap
    
    def _create_risk_colormap(self):
        """Create custom colormap for risk levels"""
        
        colors = ['#1A9850', '#91CF60', '#FEE08B', '#FC8D59', '#D73027']
        n_bins = 256
        cmap = LinearSegmentedColormap.from_list('risk', colors, N=n_bins)
        return cmap
    
    def _figure_to_base64(self, fig) -> str:
        """Convert matplotlib figure to base64 encoded PNG"""
        
        buffer = io.BytesIO()
        fig.savefig(buffer, format='png', dpi=150, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        buffer.close()
        
        return f"data:image/png;base64,{img_base64}"
    
    def _generate_error_image(self, message: str) -> str:
        """Generate error placeholder image"""
        
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, f'Error: {message}', 
               horizontalalignment='center',
               verticalalignment='center',
               fontsize=14, color='red')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        
        img_base64 = self._figure_to_base64(fig)
        plt.close(fig)
        
        return img_base64
