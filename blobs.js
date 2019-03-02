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

    return {
      position: position,
      randomSeed: Math.random() * 1000,
      randomSeed2: 15 + Math.random() * 5,
      randomSeed3: 15 + Math.random() * 5,
      randomSeed4: Math.random() * .5 + .5,
      randomSeed5: Math.random() * .5 + .5,
      object: new Point({
        position,
        hidden: false
      })
    };
  }
}

class Point {
  constructor(props)
  {
    this.x = props.position.x;
    this.y = props.position.y;
    this.hidden = props.hidden || false;
    this.body = document.createElementNS(svgNamespace, 'circle');
    window.canvas.appendChild(this.body);
  }

  draw()
  {
    if (!this.hidden) {
      utils.setProperties(this.body, {
        cx: this.x,
        cy: this.y,
        r: 2,
        fill: '#202020'
      });
    }
  }
}

class BlobCanvas
{
  constructor(blobCount = 10, blobComplexity = 5, blobSize = 20, mouseRadius = 200)
  {
    this.time = 0;
    this.blobs = [];
    this.mouseRadiusHalf = mouseRadius * .5;
    this.mouseVelocity = {
      x: null,
      y: null
    };
    this.mousePosition = {
      x: null,
      y: null
    };

    this.canvas = document.createElementNS(svgNamespace, 'svg');
    this.animationFrameBound = this.animationFrame.bind(this);

    utils.setProperties(this.canvas, {
      width: window.innerWidth,
      height: window.innerHeight
    });

    document.body.appendChild(this.canvas);
    window.canvas = this.canvas;

    while (blobCount > 0) {
      this.createBlobs(Math.max(3, Math.round(blobComplexity * .5 + blobComplexity * .5 * Math.random())), blobSize);
      blobCount--;
    }

    // Start animation
    this.animationFrameBound();

    // Start mousemove listener
    window.addEventListener('mousemove', this.mouseHandler.bind(this));
  }

  mouseHandler(event)
  {
    if (this.mousePosition.x) {
      this.mouseVelocity.x = event.clientX - this.mousePosition.x;
      this.mouseVelocity.y = event.clientY - this.mousePosition.y;
    }

    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
  }

  createBlobs(blobComplexity, blobSize)
  {
    const blob = new Blob(blobComplexity, blobSize);
    this.blobs.push(blob);
  }

  animationFrame()
  {
    window.requestAnimationFrame(this.animationFrameBound);

    const mouseRect = {
      top: this.mousePosition.y - this.mouseRadiusHalf,
      right: this.mousePosition.x + this.mouseRadiusHalf,
      bottom: this.mousePosition.y + this.mouseRadiusHalf,
      left: this.mousePosition.x - this.mouseRadiusHalf
    };

    for (let blobIndex = 0; blobIndex < this.blobs.length; blobIndex++) {
      const blob = this.blobs[blobIndex];

      let pointIndex = blob.blobComplexity - 1;

      while (pointIndex > -1) {
        const angle = pointIndex * blob.slice;
        const point = blob.points[pointIndex];
        const currentFrame = point.randomSeed + this.time;

        point.position.x += Math.cos(angle) * point.randomSeed4 * Math.cos(currentFrame / point.randomSeed2);
        point.position.y -= Math.sin(angle) * point.randomSeed5 * Math.sin(currentFrame / point.randomSeed3);

        // Check bluntly if the point is in distance to be affected by the mouse radius
        if (point.position.x > mouseRect.left && point.position.x < mouseRect.right && point.position.y > mouseRect.top && point.position.y < mouseRect.bottom) {
          const deltaX = point.position.x - this.mousePosition.x;
          const deltaY = point.position.y - this.mousePosition.y;
          const strength = Math.max(0, this.mouseRadiusHalf - Math.hypot(deltaX, deltaY));
          const mouseAngle = Math.atan2(deltaY, deltaX);

          const effect = {
            x: Math.cos(mouseAngle) * strength,
            y: Math.sin(mouseAngle) * strength
          };

          point.position.x += effect.x;
          point.position.y += effect.y;
        }

        point.object.x = point.position.x;
        point.object.y = point.position.y;

        point.object.draw();

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
new BlobCanvas(1, 10, 50);
