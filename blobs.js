class Blob {
  constructor(blobComplexity, blobSize)
  {
    this.points = [];
    this.blobComplexity = blobComplexity;
    this.blobSize = blobSize;

    const position = {
      x: Math.random() * window.canvas.getAttribute('width'),
      y: Math.random() * window.canvas.getAttribute('height')
    };

    this.centerPoint = new Point({
      position,
      hidden: false
    });

    this.radius = blobSize + (Math.random() * blobSize);
    this.slice = 2 * Math.PI / this.blobComplexity;

    // const radius = blobSize;
    let pointIndex = this.blobComplexity;

    while (pointIndex > 0) {
      // const pointRadius = radius;
      this.points.push(this.createBlobPoint(pointIndex));
      pointIndex--;
    }

    this.blobPath = document.createElementNS(svgNamespace, 'path');
    window.canvas.appendChild(this.blobPath);

    this.drawBody();
  }

  drawBody()
  {
    const pathParts = [];
    let pointIndex = 0;

    // Move to first point
    const lastPoint = this.points[this.blobComplexity - 1].position;
    const firstPoint = this.points[0].position;

    const startPoint = {
      x: (lastPoint.x + firstPoint.x) / 2,
      y: (lastPoint.y + firstPoint.y) / 2
    };

    pathParts.push(`M${startPoint.x}, ${startPoint.y}`);

    // Create continuous bezier curve parts
    while (pointIndex < this.blobComplexity - 1) {
      const currentPoint = this.points[pointIndex].position;
      const nextPoint = this.points[pointIndex + 1].position;

      const controlPoint = {
        x: (currentPoint.x + nextPoint.x) / 2,
        y: (currentPoint.y + nextPoint.y) / 2
      };

      pathParts.push(`Q${currentPoint.x}, ${currentPoint.y}`);
      pathParts.push(`${controlPoint.x}, ${controlPoint.y}`);

      pointIndex++;
    }

    // Add last curve
    const currentPoint = this.points[this.blobComplexity - 1].position;

    const endPoint = {
      x: (currentPoint.x + firstPoint.x) / 2,
      y: (currentPoint.y + firstPoint.y) / 2
    };

    pathParts.push(`Q${currentPoint.x}, ${currentPoint.y}`);
    pathParts.push(`${endPoint.x}, ${endPoint.y}`);

    utils.setProperties(this.blobPath, {
      d: pathParts.join(' '),
      fill: 'rgba(50, 155, 151, .8)'
    });
  }

  createBlobPoint(pointIndex)
  {
    const angle = pointIndex * this.slice;
    const pointRadius = this.radius + (Math.random() - Math.random()) * this.blobSize;

    const position = {
      x: this.centerPoint.x + pointRadius * Math.cos(angle),
      y: this.centerPoint.y + pointRadius * Math.sin(angle)
    };

    new Point({
      position,
      hidden: false
    });

    return {
      position: position,
      randomSeed: Math.random() * 1000,
      randomSeed2: 15 + Math.random() * 5,
      randomSeed3: Math.random()
    };
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
    this.time = 0;
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
    this.animationFrameBound();
  }

  createBlobs(blobComplexity, blobSize)
  {
    const blob = new Blob(blobComplexity, blobSize);
    this.blobs.push(blob);
  }

  animationFrame()
  {
    window.requestAnimationFrame(this.animationFrameBound);

    for (let blobIndex = 0; blobIndex < this.blobs.length; blobIndex++) {
      const blob = this.blobs[blobIndex];

      let pointIndex = blob.blobComplexity - 1;

      while (pointIndex > -1) {
        const angle = pointIndex * blob.slice;
        const point = blob.points[pointIndex];
        const currentFrame = point.randomSeed + this.time;
        point.position.x += Math.sin(currentFrame / point.randomSeed2) * point.randomSeed3;
        point.position.y -= Math.cos(currentFrame / point.randomSeed2) * point.randomSeed3;
        pointIndex--;
      }

      blob.drawBody();
    }

    this.time++;
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
new BlobCanvas(1, 10, 100);
