const gridSize = 10;

const stage = new Konva.Stage({
    container: 'container',
    width: 300,
    height: 300,
    draggable: true
});

const layer = new Konva.Layer();
stage.add(layer);

function addElement(type, options) {
    let item = new Konva.Rect({
        x: options.x || 100,
        y: options.y || 100,
        width: options.width || 100,
        height: options.height || 10,
        fill: options.fill || 'gray',
        rotation: options.rotation || 0,
        name: type,
        draggable: false,
    });

    layer.add(item);
    layer.draw();
}

function importSchematic(data) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Add elements and calculate the bounding box
    data.schematic_json.forEach(item => {
        addElement(item.type, {
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            fill: item.type === 'Wall' ? 'black' : item.type === 'Door' ? 'brown' : item.type === 'Zone' ? 'red' : 'blue',
            rotation: item.rotation
        });

        // Update bounding box
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x);
        maxY = Math.max(maxY, item.y);
    });

    // Calculate the schematic width and height
    const schematicWidth = maxX - minX;
    const schematicHeight = maxY - minY;

    // Calculate the scale to fit the schematic within the canvas
    const scaleX = stage.width() / schematicWidth;
    const scaleY = stage.height() / schematicHeight;
    const scale = Math.min(scaleX, scaleY) * .95; // Use 95% of the available space

    // Apply the scale and center the schematic
    stage.scale({ x: scale, y: scale });
    stage.position({
        x: (stage.width() - schematicWidth * scale) / 2 - minX * scale,
        y: (stage.height() - schematicHeight * scale) / 2 - minY * scale,
    });

    stage.batchDraw(); // Redraw the stage
}

// Zooming functionality with Ctrl + Scroll
stage.on("wheel", (e) => {
    if (!e.evt.ctrlKey) return;
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
});
