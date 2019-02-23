class Blob {
  constructor(blobComplexity, blobSize)
  {
    this.points = [];
    const pathParts = [];

    let pointIndex = blobComplexity;

    const position = {
      x: Math.random() * window.canvas.getAttribute('width'),
      y: Math.random() * window.canvas.getAttribute('height')
    };

    const centerPoint = new Point({
      position,
      // hidden: true
    });

    const radius = blobSize + (Math.random() * blobSize);
    // const radius = blobSize;

    while (pointIndex > 0) {
      const pointRadius = radius + (Math.random() - Math.random()) * blobSize;
      // const pointRadius = radius;
      const slice = 2 * Math.PI / blobComplexity;
      this.createBlobPoint(centerPoint, pointRadius, pointIndex, slice);
      pointIndex--;
    }

    // Move to first point
    const lastPoint = this.points[blobComplexity - 1];
    const firstPoint = this.points[0];

    const startPoint = {
      x: (lastPoint.x + firstPoint.x) / 2,
      y: (lastPoint.y + firstPoint.y) / 2
    };

    pathParts.push(`M${startPoint.x}, ${startPoint.y}`);

    // Create continuous bezier curve parts
    while (pointIndex < blobComplexity - 1) {
      const currentPoint = this.points[pointIndex];
      const nextPoint = this.points[pointIndex + 1];

      const controlPoint = {
        x: (currentPoint.x + nextPoint.x) / 2,
        y: (currentPoint.y + nextPoint.y) / 2
      };

      pathParts.push(`Q${currentPoint.x}, ${currentPoint.y}`);
      pathParts.push(`${controlPoint.x}, ${controlPoint.y}`);

      pointIndex++;
    }

    // Add last curve
    const currentPoint = this.points[blobComplexity - 1];

    const endPoint = {
      x: (currentPoint.x + firstPoint.x) / 2,
      y: (currentPoint.y + firstPoint.y) / 2
    };

    pathParts.push(`Q${currentPoint.x}, ${currentPoint.y}`);
    pathParts.push(`${endPoint.x}, ${endPoint.y}`);

    const blobPath = document.createElementNS(svgNamespace, 'path');

    utils.setProperties(blobPath, {
      d: pathParts.join(' '),
      fill: 'rgba(125, 111, 111, .5)'
    });

    window.canvas.appendChild(blobPath);
  }

  createBlobPoint(centerPoint, radius, pointIndex, slice)
  {
    const angle = pointIndex * slice;

    const position = {
      x: centerPoint.x + radius * Math.cos(angle),
      y: centerPoint.y + radius * Math.sin(angle)
    };

    this.points.push(position);

    const blobPoint = new Point({
      position,
      // hidden: true
    });
  }
}

class Point {
  constructor(props)
  {
    this.x = props.position.x;
    this.y = props.position.y;

    if (!props.hidden) {
      const pointCircle = document.createElementNS(svgNamespace, 'circle');

      utils.setProperties(pointCircle, {
        cx: this.x,
        cy: this.y,
        r: 2,
        fill: '#202020'
      });

      window.canvas.appendChild(pointCircle);
    }
  }
}

class BlobCanvas
{
  constructor(blobCount = 10, blobComplexity = 5, blobSize = 20)
  {
    this.blobs = [];
    this.canvas = document.createElementNS(svgNamespace, 'svg');
    this.animationFrameBound = this.animationFrame.bind(this);

    utils.setProperties(this.canvas, {
      width: window.innerWidth,
      height: window.innerHeight
    });

    document.body.appendChild(this.canvas);
    window.canvas = this.canvas;

    while (blobCount > 0) {
      this.createBlobs(blobComplexity, blobSize);
      blobCount--;
    }

    // Start animation
    window.requestAnimationFrame(this.animationFrameBound);
  }

  createBlobs(blobComplexity, blobSize)
  {
    const blob = new Blob(blobComplexity, blobSize);
    this.blobs.push(blob);
  }

  animationFrame()
  {
    for (let blobIndex = 0; blobIndex < this.blobs.length; blobIndex++) {
      const blob = this.blobs[blobIndex];
    }
  }
}

class BlobUtils
{
  setProperties(element, obj)
  {
    for (let prop in obj) {
      element.setAttribute(prop, obj[prop])
    }
  }
}

const svgNamespace = 'http://www.w3.org/2000/svg';
const utils = new BlobUtils();
new BlobCanvas(10, 10, 100);
