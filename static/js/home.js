const gridSize = 10;

const stage = new Konva.Stage({
    container: 'container',
    width: KonvaWidth,
    height: KonvaHeight,
    draggable: true
});

const layer = new Konva.Layer();
stage.add(layer);

// Function to calculate if the room should be washed
function lased_washed(last_washed, times_a_month) {
    const lastWashedDate = new Date(last_washed);
    const today = new Date();
    const daysSinceLastWash = Math.floor((today - lastWashedDate) / (1000 * 60 * 60 * 24));
    const daysPerWash = 30 / times_a_month;

    if (daysPerWash - daysSinceLastWash <= 1) {
        return "yellow";
    } else if (daysPerWash - daysSinceLastWash <= 0) {
        return "red";
    } else {
        return "green";
    }
}

function addToDailyPlan(name, last_washed) {
    
}

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

    // If it's a Zone, add the zone name in the middle
    if (type === 'Zone' && options.name) {
        const zoneText = new Konva.Text({
            text: options.name,
            fontSize: 16,
            fontFamily: 'Arial',
            fill: 'black',
            align: 'center',
            verticalAlign: 'middle',
            width: item.width(),
            height: item.height(),
            x: item.x(),
            y: item.y(),
            listening: false // Make the text non-interactive
        });
        // Center the text inside the rectangle
        zoneText.x(item.x() + (item.width() - zoneText.width()) / 2);
        zoneText.y(item.y() + (item.height() - zoneText.height()) / 2);

        layer.add(zoneText);
    }

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
            fill: item.type === 'Wall' ? 'black' : item.type === 'Door' ? 'brown' : item.type === 'Zone' ? lased_washed(item.last_washed, item.times_a_month) : 'blue',
            rotation: item.rotation,
            name: item.name
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


function changeSchemInPage(id) {
    const schem = schems.find(s => s.id == id);
    if (schem) {
        // Clear the layer before importing a new schematic
        layer.destroyChildren();
        importSchematic(schem);
    } else {
        console.error('Schematic not found:', id);
    }
}
