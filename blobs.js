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

    if (!this.hidden) {
      this.body = document.createElementNS(svgNamespace, 'circle');
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

    // Copy object to make it ready for the web worker
    const blobsWorkerList = JSON.parse(JSON.stringify(this.blobs));

    // Delete SVG element reference in order to successfully post to web worker
    blobsWorkerList.forEach(blob => {
      delete blob.blobPath;
    });

    myWorker.postMessage({
      blobs: blobsWorkerList,
      mousePosition: this.mousePosition,
      mouseRadiusHalf: this.mouseRadiusHalf,
      time: this.time
    })

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
let myWorker;

window.blobCanvas = new BlobCanvas(totalBlobs, 10, 100, 200);

if (window.Worker) {
  myWorker = new Worker('blobTransformation.js');

  myWorker.addEventListener('message', e => {
    e.data.blobs.forEach((blob, index) => {
      Object.assign(window.blobCanvas.blobs[index], blob);
      window.blobCanvas.blobs[index].blobPath.setAttribute('d', e.data.paths[index]);
    });
  });
}
