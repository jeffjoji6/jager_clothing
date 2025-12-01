/**
 * Mockup Generator - Creates instant previews of designs on products
 */

export interface MockupOptions {
  designImage: string; // URL of the uploaded design
  productImage: string; // URL of the product base image
  position?: 'center' | 'chest' | 'back' | 'full';
  scale?: number; // 0.1 to 1.0
  rotation?: number; // degrees
}

/**
 * Creates a mockup by compositing the design image over the product image
 * This is a client-side mockup generator using HTML5 Canvas
 */
export const generateMockup = async (
  designImageUrl: string,
  productImageUrl: string,
  options: Partial<MockupOptions> = {}
): Promise<string> => {
  const {
    position = 'center',
    scale = 0.4,
    rotation = 0,
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    const productImg = new Image();
    productImg.crossOrigin = 'anonymous';
    
    productImg.onload = () => {
      // Set canvas size to product image size
      canvas.width = productImg.width;
      canvas.height = productImg.height;

      // Draw product image
      ctx.drawImage(productImg, 0, 0);

      // Load and draw design
      const designImg = new Image();
      designImg.crossOrigin = 'anonymous';

      designImg.onload = () => {
        // Calculate design dimensions and position
        const maxWidth = productImg.width * scale;
        const maxHeight = productImg.height * scale;
        
        // Maintain aspect ratio
        let designWidth = designImg.width;
        let designHeight = designImg.height;
        const aspectRatio = designImg.width / designImg.height;
        
        if (designWidth > maxWidth) {
          designWidth = maxWidth;
          designHeight = designWidth / aspectRatio;
        }
        if (designHeight > maxHeight) {
          designHeight = maxHeight;
          designWidth = designHeight * aspectRatio;
        }

        // Calculate position based on option
        let x = 0;
        let y = 0;
        
        switch (position) {
          case 'center':
            x = (productImg.width - designWidth) / 2;
            y = (productImg.height - designHeight) / 2;
            break;
          case 'chest':
            x = (productImg.width - designWidth) / 2;
            y = productImg.height * 0.35; // Upper third
            break;
          case 'back':
            x = (productImg.width - designWidth) / 2;
            y = productImg.height * 0.4; // Slightly lower
            break;
          case 'full':
            designWidth = productImg.width * 0.9;
            designHeight = designImg.height * (designWidth / designImg.width);
            x = (productImg.width - designWidth) / 2;
            y = (productImg.height - designHeight) / 2;
            break;
        }

        // Apply rotation and draw
        ctx.save();
        ctx.translate(x + designWidth / 2, y + designHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          designImg,
          -designWidth / 2,
          -designHeight / 2,
          designWidth,
          designHeight
        );
        ctx.restore();

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };

      designImg.onerror = () => {
        reject(new Error('Failed to load design image'));
      };

      designImg.src = designImageUrl;
    };

    productImg.onerror = () => {
      reject(new Error('Failed to load product image'));
    };

    productImg.src = productImageUrl;
  });
};

/**
 * Get product mockup base image URL
 * For now, we'll use placeholder or product images
 * In production, you'd have mockup templates for each product/color
 */
export const getProductMockupImage = (productId: string, color: string): string => {
  // Map products to their mockup images
  // These should be product templates showing the garment in that color
  const mockupMap: Record<string, Record<string, string>> = {
    'tee': {
      'Black': '/mockups/tee-black.png',
      'White': '/mockups/tee-white.png',
      'Red': '/mockups/tee-red.png',
      'Blue': '/mockups/tee-blue.png',
      'Grey': '/mockups/tee-grey.png',
    },
    'hoodie': {
      'Black': '/mockups/hoodie-black.png',
      'White': '/mockups/hoodie-white.png',
      'Grey': '/mockups/hoodie-grey.png',
    },
  };

  // Return mockup image or fallback to placeholder
  return mockupMap[productId]?.[color] || '/mockups/tee-white.png';
};

