class Blob {
  constructor(blobComplexity, blobSize, index, totalBlobs)
  {
    this.points = [];
    this.blobComplexity = blobComplexity;
    this.blobSize = blobSize;

    const position = {
      x: ((index + .5) / totalBlobs) * window.canvas.getAttribute('width'),
      y: Math.random() * window.canvas.getAttribute('height')
    };

    this.centerPoint = new Point({
      position,
      hidden: true
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
    this.blobPath.setAttribute('fill', 'rgb(50, 155, 151)');
    this.blobPath.setAttribute('opacity', '.8');
    window.canvas.appendChild(this.blobPath);
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
      anchor: {
        x: position.x,
        y: position.y
      },
      velocity: {
        x: 0,
        y: 0
      },
      randomSeed: Math.random() * 1000,
      randomSeed2: 15 + Math.random() * 5,
      randomSeed3: 15 + Math.random() * 5,
      randomSeed4: Math.random() * .5 + .5,
      randomSeed5: Math.random() * .5 + .5,
      object: new Point({
        position,
        hidden: true
      })
    };
  }
}

class Point {
  constructor(props)
  {
    this.utils = window.utils;
    this.x = props.position.x;
    this.y = props.position.y;
    this.hidden = props.hidden || false;
    this.body = document.createElementNS(svgNamespace, 'circle');

    if (!this.hidden) {
      window.canvas.appendChild(this.body);
    }
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

    this.fpsInterval = 16.667;
    this.previousTime = window.performance.now();

    this.canvas = document.createElementNS(svgNamespace, 'svg');
    this.animationFrameBound = this.animationFrame.bind(this);

    utils.setProperties(this.canvas, {
      xmlns: svgNamespace,
      width: window.innerWidth,
      height: window.innerHeight,
      style: 'transform: translate3d(0, 0, 0)'
    });

    document.body.appendChild(this.canvas);
    window.canvas = this.canvas;

    while (blobCount > 0) {
      const blob = new Blob(Math.max(3, Math.round(blobComplexity * .5 + blobComplexity * .5 * Math.random())), blobSize, this.blobs.length, totalBlobs);
      this.blobs.push(blob);
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

    this.mousePosition.x = event.clientX + window.scrollX;
    this.mousePosition.y = event.clientY + window.scrollY;
  }

  animationFrame(newTime)
  {
    window.requestAnimationFrame(this.animationFrameBound);

    const timeElapsed = (newTime | 0) - this.previousTime;

    if (timeElapsed < this.fpsInterval) {
      return;
    }

    this.previousTime = newTime - (this.previousTime % this.fpsInterval);

    const mouseRect = [
      this.mousePosition.y - this.mouseRadiusHalf, // 0 Top
      this.mousePosition.x + this.mouseRadiusHalf, // 1 Right
      this.mousePosition.y + this.mouseRadiusHalf, // 2 Bottom
      this.mousePosition.x - this.mouseRadiusHalf  // 3 Left
    ];

    this.blobs.forEach(blob => {
      let pointIndex = blob.blobComplexity - 1;

      while (pointIndex > -1) {
        const angle = pointIndex * blob.slice;
        const point = blob.points[pointIndex];
        const currentFrame = point.randomSeed + this.time;

        point.velocity.x += Math.cos(angle) * point.randomSeed4 * Math.cos(currentFrame / point.randomSeed2) * .4;
        point.velocity.y -= Math.sin(angle) * point.randomSeed5 * Math.sin(currentFrame / point.randomSeed3) * .4;

        // Check bluntly if the point is in distance to be affected by the mouse radius
        if (point.position.x > mouseRect[3] && point.position.x < mouseRect[1] && point.position.y > mouseRect[0] && point.position.y < mouseRect[2]) {
          const deltaX = point.position.x - this.mousePosition.x;
          const deltaY = point.position.y - this.mousePosition.y;
          const strength = Math.max(0, this.mouseRadiusHalf - Math.hypot(deltaX, deltaY)) * .02;
          const mouseAngle = Math.atan2(deltaY, deltaX);

          point.velocity.x += Math.cos(mouseAngle) * strength;
          point.velocity.y += Math.sin(mouseAngle) * strength
        }

        point.velocity.x += (point.anchor.x - point.position.x) * .02;
        point.velocity.y += (point.anchor.y - point.position.y) * .02;

        point.position.x += point.velocity.x;
        point.position.y += point.velocity.y;

        point.velocity.x *= .95;
        point.velocity.y *= .95;

        point.object.x = point.position.x;
        point.object.y = point.position.y;

        point.object.draw();

        pointIndex--;
      }

      // Draw body
      let pathParts = '';
      pointIndex = 0;

      // Move to first point
      const lastPoint = blob.points[blob.blobComplexity - 1].position;
      const firstPoint = blob.points[0].position;

      const startPoint = {
        x: (lastPoint.x + firstPoint.x) / 2,
        y: (lastPoint.y + firstPoint.y) / 2
      };

      pathParts = pathParts.concat(`M${startPoint.x}, ${startPoint.y}`);

      const blobComplexityMinusOne = blob.blobComplexity - 1;

      // Create continuous bezier curve parts
      while (pointIndex < blobComplexityMinusOne) {
        const currentPoint = blob.points[pointIndex].position;
        const nextPoint = blob.points[pointIndex + 1].position;

        const controlPoint = {
          x: (currentPoint.x + nextPoint.x) / 2,
          y: (currentPoint.y + nextPoint.y) / 2
        };

        pathParts = pathParts.concat(` Q${currentPoint.x}, ${currentPoint.y}`);
        pathParts = pathParts.concat(` ${controlPoint.x}, ${controlPoint.y}`);

        pointIndex++;
      }

      // Add last curve
      const currentPoint = blob.points[blobComplexityMinusOne].position;

      const endPoint = {
        x: (currentPoint.x + firstPoint.x) / 2,
        y: (currentPoint.y + firstPoint.y) / 2
      };

      pathParts = pathParts.concat(` Q${currentPoint.x}, ${currentPoint.y}`);
      pathParts = pathParts.concat(` ${endPoint.x}, ${endPoint.y}`);

      blob.blobPath.setAttribute('d', pathParts);
    });

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
const totalBlobs = 10;
new BlobCanvas(totalBlobs, 10, 100, 200);
