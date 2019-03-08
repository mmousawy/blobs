onmessage = function(e) {
  const data = e.data;

  const mouseRect = [
    data.mousePosition.y - data.mouseRadiusHalf, // 0 Top
    data.mousePosition.x + data.mouseRadiusHalf, // 1 Right
    data.mousePosition.y + data.mouseRadiusHalf, // 2 Bottom
    data.mousePosition.x - data.mouseRadiusHalf  // 3 Left
  ];

  const blobPaths = [];

  data.blobs.forEach(blob => {
    let pointIndex = blob.blobComplexity - 1;

    while (pointIndex > -1) {
      const angle = pointIndex * blob.slice;
      const point = blob.points[pointIndex];
      const currentFrame = point.randomSeed + data.time;

      point.velocity.x += Math.cos(angle) * point.randomSeed4 * Math.cos(currentFrame / point.randomSeed2) * .4;
      point.velocity.y -= Math.sin(angle) * point.randomSeed5 * Math.sin(currentFrame / point.randomSeed3) * .4;

      // Check bluntly if the point is in distance to be affected by the mouse radius
      if (point.position.x > mouseRect[3] && point.position.x < mouseRect[1] && point.position.y > mouseRect[0] && point.position.y < mouseRect[2]) {
        const deltaX = point.position.x - data.mousePosition.x;
        const deltaY = point.position.y - data.mousePosition.y;
        const strength = Math.max(0, data.mouseRadiusHalf - Math.hypot(deltaX, deltaY)) * .02;
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

    blobPaths.push(pathParts);
  });

  postMessage({
    blobs: data.blobs,
    paths: blobPaths
  });
}
