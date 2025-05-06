const gridSize = 10;

const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8,
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
    try {
        data.forEach(item => {
            addElement(item.type, {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
                fill: item.type === 'Wall' ? 'black' : item.type === 'Door' ? 'brown' : 'blue',
                rotation: item.rotation
            });
        });
    } catch (error) {
        alert("Invalid JSON data.");
    }
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
