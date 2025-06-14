const width = 800;
const height = 800;
const gridSize = 10;
let elements = [];
let waitingForWallClick = false;

const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8,

    draggable: true
});

const layer = new Konva.Layer();
stage.add(layer);

let zoneColors = {};

// Helper to get next zone id (persistent)
function getNextZoneId() {
    let currentId = parseInt(localStorage.getItem('zoneIdCounter') || '1', 10);
    localStorage.setItem('zoneIdCounter', (currentId + 1).toString());
    return currentId;
}

// Helper to get or assign a persistent id for a zone name
function getZoneIdByName(zoneName) {
    let zoneNameToId = JSON.parse(localStorage.getItem('zoneNameToId') || '{}');
    if (zoneNameToId[zoneName]) {
        return zoneNameToId[zoneName];
    }
    // Get next id
    let currentId = parseInt(localStorage.getItem('zoneIdCounter') || '1', 10);
    zoneNameToId[zoneName] = currentId;
    localStorage.setItem('zoneNameToId', JSON.stringify(zoneNameToId));
    localStorage.setItem('zoneIdCounter', (currentId + 1).toString());
    return currentId;
}

function getRandomColor() {
    const random1 = Math.floor(Math.random() * 256); // Random value between 0-255
    const random2 = Math.floor(Math.random() * 256);
    const random3 = Math.floor(Math.random() * 256);
    return `rgb(${random1}, ${random2}, ${random3})`;
}

function addElement(type, options) {
    // Add today's date if it's a Zone and last_washed is not set
    if (type === "Zone" && !options.last_washed) {
        const today = new Date();
        // Format as YYYY-MM-DD
        options.last_washed = today.toISOString().split('T')[0];
    }

    let item = new Konva.Rect({
        x: Math.round((options.x || 100) / gridSize) * gridSize,
        y: Math.round((options.y || 100) / gridSize) * gridSize,
        width: options.width || 100,
        height: options.height || 10,
        fill: options.fill || 'gray',
        draggable: true,
        rotation: options.rotation || 0,
        type: type,
        name: options.name || type,
        id: options.id,
        times_a_month: options.times_a_month || undefined,
        last_washed: type === "Zone" ? options.last_washed : undefined // Add last_washed for zones
    });

    if (type === "Door") {
        item.moveToTop();
    }

    item.on('click', () => {
        let tr = new Konva.Transformer({
            nodes: [item],
            enabledAnchors: [
                'middle-left', 'middle-right', 'top-center', 'bottom-center' // Midtsider
            ],
            boundBoxFunc: (oldBox, newBox) => {
                // Forhindre at sonen blir for liten
                if (newBox.width < 10 || newBox.height < 10) {
                    return oldBox;
                }
                return newBox;
            },
        });

        layer.add(tr);
        item.draggable(true);
        layer.draw();

        // Fjern transformatoren når brukeren klikker utenfor
        stage.on('click', (e) => {
            if (e.target !== item) {
                tr.destroy();
                item.draggable(false);
                layer.draw();
            }
        });

        // Legg til slett-knapp
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        document.getElementById("maker-buttons").appendChild(deleteButton);

        deleteButton.addEventListener('click', () => {
            if (item.zoneText) {
                item.zoneText.destroy(); // Destroy the text
            }
            item.destroy();
            tr.destroy();
            deleteButton.remove();
            layer.draw();
            updateOutput();
        });

        stage.on('click', (e) => {
            if (e.target !== item) {
                deleteButton.remove();
            }
        });
    });

    // Update JSON when dragging
    item.on('dragmove', () => {
        item.x(Math.round(item.x() / gridSize) * gridSize);
        item.y(Math.round(item.y() / gridSize) * gridSize);

        updateOutput();
    });

    // Update JSON when transforming (resizing)
    item.on('transform', () => {
        let newWidth = Math.round(item.width() * item.scaleX());
        let newHeight = Math.round(item.height() * item.scaleY());

        // Ensure the size only changes in steps of 10
        newWidth = Math.round(newWidth / 10) * 10;
        newHeight = Math.round(newHeight / 10) * 10;

        // Prevent objects from becoming too small (minimum 10px)
        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(10, newHeight);

        document.getElementById('width').textContent = newWidth / 100;
        document.getElementById('height').textContent = newHeight / 100;

        // Reset scale to avoid cumulative scaling issues
        item.scaleX(1);
        item.scaleY(1);

        // Apply the snapped dimensions
        item.width(newWidth);
        item.height(newHeight);

        updateOutput();
    });

    // Add snapping for rotation
    item.on('transformend', () => {
        let rotation = item.rotation();
        let snapAngles = [0, 90, 180, 270];
        let closestAngle = snapAngles.reduce((prev, curr) => Math.abs(curr - rotation) < Math.abs(prev - rotation) ? curr : prev);
        if (Math.abs(rotation - closestAngle) < 10) {
            item.rotation(closestAngle);
        }
        layer.draw();
        updateOutput();
    });

    layer.add(item);

    elements.push({
        type,
        x: item.x(),
        y: item.y(),
        width: item.width(),
        height: item.height(),
        rotation: item.rotation(),
        name: type === "Zone" ? options.name : undefined,
        id: type === "Zone" ? options.id : undefined,
        times_a_month: type === "Zone" ? options.times_a_month : undefined,
        last_washed: type === "Zone" ? options.last_washed : undefined // Store last_washed in elements
    });

    if (type === "Zone") {
        // Add the zone name text
        const zoneText = new Konva.Text({
            x: item.x(),
            y: item.y(),
            text: options.name,
            fontSize: 16,
            fontFamily: 'Arial',
            fill: 'black',
            align: 'center',
            verticalAlign: 'middle',
            width: item.width(),
            height: item.height(),
            listening: false // Make the text non-interactive
        });
        zoneText.x(item.x() + (item.width() - zoneText.width()) / 2);
        zoneText.y(item.y() + (item.height() - zoneText.height()) / 2);

        item.zoneText = zoneText; // Add this line

        item.on('dragmove', () => {
            zoneText.x(item.x() + (item.width() - zoneText.width()) / 2);
            zoneText.y(item.y() + (item.height() - zoneText.height()) / 2);
        });
        item.on('transform', () => {
            zoneText.width(item.width());
            zoneText.height(item.height());
            zoneText.x(item.x() + (item.width() - zoneText.width()) / 2);
            zoneText.y(item.y() + (item.height() - zoneText.height()) / 2);
        });
        layer.add(zoneText);
    }

    layer.draw();
    updateOutput();
}

function addDoor() {
    addElement('Door', { width: 100, height: 10, fill: 'brown' });
}

function startAddingDoor() {
    waitingForWallClick = true;
}

stage.on('click', (e) => {
    if (waitingForWallClick) {
        let clickedWall = e.target;
        if (clickedWall.attrs.name === 'Wall') {
            addDoorToWall(clickedWall);
            waitingForWallClick = false;
        }
    }
});

function addWall() {
    addElement('Wall', { width: 200, height: 10, fill: 'black' });
}

// Add id to zone when created, using name-to-id mapping
function addZone() {
    const zoneName = prompt("Enter a name for the zone:");
    if (!zoneName) {
        alert("Zone name is required.");
        return;
    }

    // Assign a random color to the zone name if it doesn't already have one
    if (!zoneColors[zoneName]) {
        zoneColors[zoneName] = getRandomColor();
        localStorage.setItem('zoneColors', JSON.stringify(zoneColors));
    }

    // Get id for this zone name (same id for same name)
    const zoneId = getZoneIdByName(zoneName);

    addElement('Zone', {
        width: 100,
        height: 100,
        fill: zoneColors[zoneName],
        name: zoneName,
        id: zoneId
    });
}

// Reset zone id counter when clearing canvas
function clearCanvas() {
    layer.destroyChildren();
    elements = [];
    layer.draw();
    updateOutput();

    // Fjern data fra localStorage
    localStorage.removeItem('schematicData');
    localStorage.removeItem('zoneIdCounter'); // Reset zone id counter
    localStorage.removeItem('zoneNameToId'); // Clear mapping
}

function updateOutput() {
    elements = layer.children.filter(item => item.className === 'Rect').map(item => ({
        type: item.attrs.type,
        name: item.attrs.type === 'Zone' ? item.attrs.name : undefined, // Include the zone name if it's a zone
        id: item.attrs.type === 'Zone' ? item.attrs.id : undefined, // Include id
        times_a_month: item.attrs.type === 'Zone' ? item.attrs.times_a_month : undefined, // Include the times_a_month if it's a zone
        last_washed: item.attrs.type === 'Zone' ? item.attrs.last_washed : undefined, // Include last_washed if it's a zone
        x: Math.round(item.x()),
        y: Math.round(item.y()),
        width: item.width(),
        height: item.height(),
        rotation: item.rotation()
    }));
    localStorage.setItem('schematicData', JSON.stringify(elements)); // Save updated data to localStorage
}

function exportSchematic() {
    alert("Schematic exported! Check below for JSON output.");
    updateOutput();
}

// When importing or restoring, update the mapping so it stays in sync
function importSchematic() {
    const inputData = prompt("Paste your JSON data:");
    if (!inputData) return;

    try {
        const parsedData = JSON.parse(inputData);
        clearCanvas();
        let maxZoneId = 0;
        let zoneNameToId = {};
        parsedData.forEach(item => {
            addElement(item.type, {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
                fill: item.type === 'Wall' ? 'black' : item.type === 'Door' ? 'brown' : 'blue',
                rotation: item.rotation,
                name: item.type === 'Zone' ? item.name : undefined,
                times_a_month: item.type === 'Zone' ? item.times_a_month : undefined,
                last_washed: item.type === 'Zone' ? item.last_washed : undefined, // Restore last_washed
                id: item.type === 'Zone' ? item.id : undefined
            });
            if (item.type === 'Zone') {
                zoneNameToId[item.name] = item.id;
                if (item.id > maxZoneId) {
                    maxZoneId = item.id;
                }
            }
        });
        if (maxZoneId > 0) {
            localStorage.setItem('zoneIdCounter', (maxZoneId + 1).toString());
        }
        localStorage.setItem('zoneNameToId', JSON.stringify(zoneNameToId));
    } catch (error) {
        alert("Invalid JSON data.");
    }
}

// Zooming functionality with Ctrl + Scroll
let zoomTimeout;

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

function showSchematicEditor(classDiv) {
    for (let i = 0; i < document.getElementsByClassName('pageChange').length; i++) {

        if (classDiv == "schematic-editor") {
            if (document.getElementById('schematic-name-input').value === "") {
                alert("Please enter a name for the schematic.");
                return;
            } 
            localStorage.setItem('schematicName', document.getElementById('schematic-name-input').value);
        }

        if (classDiv == "schematic-zone") {
            const schematicData = localStorage.getItem('schematicData');
            if (!schematicData) {
                alert("Please make a schematic.");
                return;
            }

            showZoneInputs();
        }

        document.getElementsByClassName('pageChange')[i].style.display = 'none';
    }

    document.getElementsByClassName(classDiv)[0].style.display = 'block';
}

// Gjenopprett lagrede data fra localStorage
window.onload = () => {
    const savedData = localStorage.getItem('schematicData');
    if (savedData) {
        const savedZoneColors = localStorage.getItem('zoneColors');
        try {
            const parsedData = JSON.parse(savedData);
            zoneColors = savedZoneColors ? JSON.parse(savedZoneColors) : {};
            let zoneNameToId = {};
            let maxZoneId = 0;
            parsedData.forEach(item => {
                addElement(item.type, {
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height,
                    fill: item.type === 'Wall' ? 'black' : item.type === 'Door' ? 'brown' : item.type === 'Zone' ? zoneColors[item.name] : 'blue',
                    name: item.type === 'Zone' ? item.name : undefined,
                    times_a_month: item.type === 'Zone' ? item.times_a_month : undefined, // Restore times_a_month
                    last_washed: item.type === 'Zone' ? item.last_washed : undefined, // Restore last_washed
                    id: item.type === 'Zone' ? item.id : undefined, // Restore id
                    rotation: item.rotation,
                });
                if (item.type === 'Zone') {
                    zoneNameToId[item.name] = item.id;
                    if (item.id > maxZoneId) {
                        maxZoneId = item.id;
                    }
                }
            });
            if (maxZoneId > 0) {
                localStorage.setItem('zoneIdCounter', (maxZoneId + 1).toString());
            }
            localStorage.setItem('zoneNameToId', JSON.stringify(zoneNameToId));
        } catch (error) {
            console.error("Failed to load schematic data:", error);
        }
    }

    const schematicName = localStorage.getItem('schematicName');
    if (schematicName) {
        document.getElementById('schematic-name-input').value = schematicName;
        document.getElementById('schematic-name').style.display = 'none';
        document.getElementById('schematic-editor').style.display = 'block';
    } else {
        document.getElementById('schematic-name').style.display = 'block';
        document.getElementById('schematic-editor').style.display = 'none';
    }
};

function sendSchematic() {
    const schematicName = document.getElementById('schematic-name-input').value;
    if (!schematicName) {
        alert("Please enter a name for the schematic before sending.");
        return;
    }

    const schematicData = localStorage.getItem('schematicData');
    if (!schematicData) {
        alert("No schematic data to send.");
        return;
    }

    // check if every zone input has a value
    const ZoneInput = document.getElementsByClassName('zone-input');
    for (let i = 0; i < ZoneInput.length; i++) {
        if (ZoneInput[i].value === "") {
            const emptyZone = document.getElementById(ZoneInput[i].id);
            emptyZone.style.border = "2px solid red";

            // Scroll to the empty zone
            emptyZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            emptyZone.focus();
            emptyZone.placeholder = "Please fill in this zone";
            emptyZone.addEventListener('input', () => {
                emptyZone.style.border = "none";
                emptyZone.placeholder = "Enter value";
            });

            alert("Please fill in all zone inputs.");
            return;
        }
    };

    fetch('/upload-schematic/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(), // Include CSRF token for Django
        },
        body: JSON.stringify({
            "schematic_name": schematicName,
            "schematic_json": JSON.parse(schematicData),
        }),
    })
    .then(response => {
        if (response.ok) {
            alert("Schematic sent successfully!");
            localStorage.removeItem('schematicData');
            localStorage.removeItem('schematicName');
            window.location.href = response.url;

        } else {
            alert("Failed to send schematic.");
        }
    })
    .catch(error => {
        console.error("Error sending schematic:", error);
        alert("An error occurred while sending the schematic.");
    });
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


function toggleMakerButtons() {
    const makerButtons = document.querySelector('.maker-buttons');
    makerButtons.classList.toggle('open');
    const MakerMenu = document.getElementById("maker-menu-button");
    if (makerButtons.classList.contains('open')) {
        MakerMenu.style.transform = "rotate(0deg)";
    } else {
        MakerMenu.style.transform = "rotate(-90deg)";
    }
}

function restartMaker() {
    clearCanvas();
    localStorage.removeItem('schematicData');
    localStorage.removeItem('schematicName');
    document.getElementById('schematic-name').style.display = 'block';
    document.getElementById('schematic-editor').style.display = 'none';
    document.getElementById('schematic-name-input').value = "";
}

function showZoneInputs() {
    const schematicData = localStorage.getItem('schematicData');
    if (!schematicData) {
        alert("No schematic data to show.");
        return;
    }
    const parsedData = JSON.parse(schematicData);
    const zoneInputsContainer = document.getElementById('zones');
    zoneInputsContainer.innerHTML = ""; // Clear previous inputs

    // Collect unique zones by id
    const uniqueZones = {};
    parsedData.forEach(item => {
        if (item.type === 'Zone' && item.id !== undefined) {
            if (!uniqueZones[item.id]) {
                uniqueZones[item.id] = item;
            }
        }
    });

    Object.values(uniqueZones).forEach(item => {
        // Make div for zone inputs
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-input-div';
        zoneDiv.style.backgroundColor = zoneColors[item.name];
        zoneInputsContainer.appendChild(zoneDiv);

        // Create a label for the zone
        const zoneLabel = document.createElement('label');
        zoneLabel.textContent = item.name;
        zoneLabel.className = 'zone-label';
        zoneDiv.appendChild(zoneLabel);

        // Create a new input for each unique zone id
        const zoneInput = document.createElement('input');
        zoneInput.type = 'number';
        zoneInput.value = item.times_a_month || '';
        zoneInput.placeholder = "Enter value";
        zoneInput.min = 0;
        zoneInput.id = `zone-input-${item.id}`;
        zoneInput.className = 'zone-input';
        zoneInput.addEventListener('input', (e) => {
            const value = e.target.value;
            // Update all zones with this id in parsedData
            parsedData.forEach((zone) => {
                if (zone.type === 'Zone' && zone.id === item.id) {
                    zone.times_a_month = value;
                }
            });
            // Update all Konva elements with this id
            layer.children.forEach(child => {
                if (child.attrs && child.attrs.type === 'Zone' && child.attrs.id === item.id) {
                    child.attrs.times_a_month = value;
                }
            });
            localStorage.setItem('schematicData', JSON.stringify(parsedData));
            updateOutput();
        });
        zoneDiv.appendChild(zoneInput);
    });
}