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

    if (daysPerWash - daysSinceLastWash <= 0) {
        return "red";
    } else if (daysPerWash - daysSinceLastWash <= 2) {
        return "orange";
    } else {
        return "green";
    }
}

function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return null;
}

function addToDailyPlan(name, last_washed, times_a_month) {
    const color = lased_washed(last_washed, times_a_month);
    if (color == "green") {
        return;
    }

    const checkDup = document.getElementById(`dailyplan-${name}`);
    if (checkDup) {
        return;
    }

    const planList = document.getElementById('dailyplan-list');
    const listItem = document.createElement('li');
    listItem.style.color = color;
    listItem.id = `dailyplan-${name}`;
    listItem.className = 'dailyplan-item';

    if (color == "orange") {
        listItem.textContent = `${name} - should be washed soon!`;
    } else {
        listItem.textContent = `${name} - needs washing!`;
    }

    const UnderInfo = document.createElement('ul');
    listItem.appendChild(UnderInfo);

    const lastWashedItem = document.createElement('li');
    const date = new Date(last_washed).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    lastWashedItem.textContent = `Last washed: ${date}`;
    UnderInfo.appendChild(lastWashedItem);


    planList.appendChild(listItem);

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

        item.on('click', () => {
            document.getElementById('timer-wrapper').style.display = 'flex';
            document.getElementById('zone_id_clicked').value = options.id;
            document.getElementById('washing-room').textContent = options.name;

            GetEstimatedTime(options.id, document.getElementById('select').value);
        });
    }

    layer.draw();
}

function GetEstimatedTime(zone_id, schem_id) {
    fetch(`/zone/estimated_time/${zone_id}/${schem_id}/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const estimatedTime = data.estimated_time;
                const timeDisplay = document.getElementById('estimated-time');
                timeDisplay.textContent = `Estimated time: ${estimatedTime} seconds`;
            } else {
                console.error('Error fetching estimated time:', data.message);
            }
        })
}

function sendTime(schem_id_select, elapsed) {
    const zone_id_input = document.getElementById('zone_id_clicked').value;

    console.log(schem_id_select, elapsed, zone_id_input);


    fetch('/zone/washed/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            schem_id: schem_id_select,
            zone_id: zone_id_input,
            time_used: elapsed,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while washing the zone.');
    });
    
}

let startTime = null;
let intervalId = null;
let isRunning = false;

const timeDisplay = document.getElementById('timer');
const startStopBtn = document.getElementById('timer-button');

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

startStopBtn.addEventListener('click', () => {
    if (!isRunning) {
        startTime = Date.now();
        intervalId = setInterval(updateTimer, 1000);
        startStopBtn.textContent = 'Stop';
        startStopBtn.style.backgroundColor = 'red';
        isRunning = true;
    } else {
        clearInterval(intervalId);
        startStopBtn.textContent = 'Start';
        startStopBtn.style.backgroundColor = 'green';
        isRunning = false;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`Timer stopped at ${elapsed} seconds.`);

        // if (elapsed < 60) {
        //     alert('You need to wash the zone for at least 1 minute!');
        //     return;
        // }

        const schem_id_select = document.getElementById('select').value;

        sendTime(schem_id_select, elapsed);
    }
});

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
            name: item.name,
            id: item.id,
            last_washed: item.last_washed,
            times_a_month: item.times_a_month
        });

        // Update bounding box
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x);
        maxY = Math.max(maxY, item.y);

        if (item.type === 'Zone' && document.getElementById('dailyplan-list')) {
            // Add to daily plan
            addToDailyPlan(item.name, item.last_washed, item.times_a_month);
        }
    });

    // Calculate the schematic width and height
    const schematicWidth = maxX - minX;
    const schematicHeight = maxY - minY;

    // Calculate the scale to fit the schematic within the canvas
    const scaleX = stage.width() / schematicWidth;
    const scaleY = stage.height() / schematicHeight;
    const scale = Math.min(scaleX, scaleY) * .95;

    // Apply the scale and center the schematic
    stage.scale({ x: scale, y: scale });
    stage.position({
        x: (stage.width() - schematicWidth * scale) / 2 - minX * scale,
        y: (stage.height() - schematicHeight * scale) / 2 - minY * scale,
    });



    stage.batchDraw();
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
