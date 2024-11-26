// Function to get query parameters
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
}

// Function to set input values
function setInputValues(data) {
    Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = data[key];
        }
    });
}

// Function to load initial data
function loadInitialData() {
    const queryParams = getQueryParams();
    
    if (Object.keys(queryParams).length > 0) {
        // Load data from query parameters
        setInputValues(queryParams);
    } else {
        // Pre-populate with user ID 'mona'
        setInputValues({
            firstname: 'Mona',
            lastname: 'Lisa',
            company: 'GitHub',
            jobtitle: 'Octocat',
            pronouns: '',
            githubhandle: 'mona'
        });
    }
    
    // Update full string after setting initial values
    updateFullString();
    drawBadge(); // Add this line
}

// Call loadInitialData when the page loads
window.addEventListener('load', loadInitialData);

const inputs = document.querySelectorAll('input:not(#fullstring)');
const fullStringInput = document.getElementById('fullstring');
const qrcodeContainer = document.getElementById('qrcode');
const canvas = document.getElementById('badgeCanvas');
const ctx = canvas.getContext('2d');

// Add this near the top of the file with other constants
const backgroundImage = new Image();
backgroundImage.src = './back.png';

function updateFullString() {
    const id = '01234567890'; // Static ID for this example
    
    // Create an object to store field values by name
    const fieldValues = {};
    inputs.forEach(input => {
        if (input.name === 'githubhandle') {
            fieldValues[input.name] = input.value ? `@${input.value}` : '';
        } else {
            fieldValues[input.name] = input.value;
        }
    });

    // Define the order of fields
    const fieldOrder = ['firstname', 'lastname', 'company', 'jobtitle', 'pronouns', 'githubhandle'];

    // Map the ordered fields to their values
    const orderedValues = fieldOrder.map(fieldName => fieldValues[fieldName] || '');

    // Join the values and create the full string
    fullStringInput.value = `${id}iD^${orderedValues.join('^')}^`;
    generateQRCode();
    drawBadge(); // Add this line
}

function generateQRCode() {
    qrcodeContainer.innerHTML = '';
    const qr = qrcode(0, 'L');
    qr.addData(fullStringInput.value);
    qr.make();
    qrcodeContainer.innerHTML = qr.createImgTag(5);
}

// Debounce function to limit API calls
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to fetch GitHub user data
async function fetchGitHubUser(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) throw new Error('User not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching GitHub user:', error);
        return null;
    }
}

// Add this helper function before updateFormWithGitHubData
function cleanJobTitle(title) {
    return title.replace(/\s*@\w+$/, '').trim();
}

// Function to update form fields with GitHub data
function updateFormWithGitHubData(data) {
    if (data) {
        document.getElementById('firstname').value = data.name ? data.name.split(' ')[0] : '';
        document.getElementById('lastname').value = data.name ? data.name.split(' ').slice(1).join(' ') : '';
        document.getElementById('company').value = data.company ? data.company.replace(/^@/, '') : '';
        document.getElementById('jobtitle').value = data.bio ? cleanJobTitle(data.bio.split('.')[0].trim()) : '';
        updateFullString(); // Update the full string with new data
    }
}

// Event handler for GitHub handle input
const handleGitHubInput = debounce(async (event) => {
    const username = event.target.value.trim();
    if (username) {
        const userData = await fetchGitHubUser(username);
        updateFormWithGitHubData(userData);
    }
}, 250); // 250ms delay

// Add event listeners to GitHub handle input
const githubHandleInput = document.getElementById('githubhandle');
githubHandleInput.addEventListener('input', handleGitHubInput);
githubHandleInput.addEventListener('blur', handleGitHubInput);

// Modify the input event listeners to clean job titles
inputs.forEach(input => {
    input.addEventListener('input', (e) => {
        if (e.target.id === 'jobtitle') {
            e.target.value = cleanJobTitle(e.target.value);
        }
        updateFullString();
    });
});

updateFullString(); // Initial generation

const otherInputs = document.querySelectorAll('input:not(#fullstring)');

function parseFullString(fullString) {
    const parts = fullString.split('^');
    const id = parts[0].replace('iD', '');
    const fields = ['firstname', 'lastname', 'company', 'jobtitle', 'pronouns', 'githubhandle'];
    const values = parts.slice(1, -1); // Exclude the last empty element

    const result = { id };
    fields.forEach((field, index) => {
        result[field] = values[index] || '';
    });

    if (result.githubhandle && !result.githubhandle.startsWith('@')) {
        result.githubhandle = '@' + result.githubhandle;
    }

    return result;
}

function updateFieldsFromFullString() {
    const parsed = parseFullString(fullStringInput.value);
    
    otherInputs.forEach(input => {
        if (parsed.hasOwnProperty(input.name)) {
            input.value = parsed[input.name];
        }
    });
}

const debounceUpdateFields = debounce(updateFieldsFromFullString, 250);

fullStringInput.addEventListener('input', debounceUpdateFields);
fullStringInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        updateFieldsFromFullString();
    }
});

// Modify the drawBadge function
function drawBadge() {
    // Enable crisp font rendering
    ctx.textRendering = 'optimizeLegibility';
    ctx.imageSmoothingEnabled = false;
    ctx.antialias = 'none';
    
    const bottomMargin = 10;
    const leftMargin = 10;
    const topMargin = 10;
    
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'top';
    
    // Draw first name in bold
    ctx.font = 'bold 32px "Mona Sans"';
    ctx.fillStyle = '#000000';
    const firstname = document.getElementById('firstname').value;
    ctx.fillText(firstname, leftMargin, topMargin);
    
    // Draw last name in bold
    ctx.font = 'bold 24px "Mona Sans"';
    const lastname = document.getElementById('lastname').value;
    ctx.fillText(lastname, leftMargin, 45);
        
    // Get GitHub handle
    let githubhandle = document.getElementById('githubhandle').value;
    if (githubhandle && !githubhandle.startsWith('@')) {
        githubhandle = '@' + githubhandle;
    }
    
    // Calculate dynamic font size for job title
    let jobtitleFontSize = 16;  // Default font size
    const jobtitle = document.getElementById('jobtitle').value;
    
    if (jobtitle) {  // Only calculate new size if jobtitle is not empty
        ctx.font = `${jobtitleFontSize}px "Mona Sans"`;
        while (ctx.measureText(jobtitle).width > canvas.width - 40 && jobtitleFontSize > 8) {
            jobtitleFontSize--;
            ctx.font = `${jobtitleFontSize}px "Mona Sans"`;
        }
    }
    
    // Calculate text metrics to fit job title within canvas
    ctx.font = `${jobtitleFontSize}px "Mona Sans"`;
    const fontMetrics = ctx.measureText("Jobby");
    const textHeight = fontMetrics.actualBoundingBoxAscent + fontMetrics.actualBoundingBoxDescent;
    const lineHeightGap = textHeight * 0.3; 

    const githubHandleY = (canvas.height) - bottomMargin - textHeight;
    const jobTitleY = githubHandleY - textHeight - lineHeightGap;
    
    // Draw the text
    ctx.fillText(jobtitle, leftMargin, jobTitleY);
    ctx.fillText(githubhandle, leftMargin, githubHandleY);

    // Convert to 2-bit black and white after drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bwCanvas = convertTo2BitBW(imageData);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bwCanvas, 0, 0);
}

// Replace the font loading with combined font and image loading
Promise.all([
    document.fonts.ready,
    new Promise(resolve => backgroundImage.onload = resolve)
]).then(() => {
    drawBadge();
});

// Update the event listener to handle resize
window.addEventListener('resize', drawBadge);

// Add this function to convert image data to 2-bit black and white
function convertTo2BitBW(imageData) {
    const threshold = 200;
    const newCanvas = document.createElement('canvas');
    newCanvas.width = imageData.width;
    newCanvas.height = imageData.height;
    const ctx = newCanvas.getContext('2d');
    
    // Create new imageData
    const newImageData = ctx.createImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        // Convert to grayscale first
        const gray = (imageData.data[i] * 0.299 + 
                     imageData.data[i + 1] * 0.587 + 
                     imageData.data[i + 2] * 0.114);
        
        // Convert to black or white (2-bit)
        const bw = gray < threshold ? 0 : 255;
        
        newImageData.data[i] = bw;     // R
        newImageData.data[i + 1] = bw; // G
        newImageData.data[i + 2] = bw; // B
        newImageData.data[i + 3] = 255;// A
    }
    
    ctx.putImageData(newImageData, 0, 0);
    return newCanvas;
}

// Modify the downloadBadge function to use the conversion
function downloadBadge() {
    const canvas = document.getElementById('badgeCanvas');
    const link = document.createElement('a');
    link.download = 'badge.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Add the copyToBadge function to handle the file transfer over serial using the Web Serial API
async function copyToBadge() {
    if ('serial' in navigator) {
        try {
            // Request a serial port
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });

            const encoder = new TextEncoderStream();
            const writableStreamClosed = encoder.readable.pipeTo(port.writable);
            const writer = encoder.writable.getWriter();

            const decoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(decoder.writable);
            const reader = decoder.readable.getReader();

            // Helper function to send data
            async function sendCommand(command) {
                await writer.write(command + '\r\n');
            }

            // Enter raw REPL mode
            await sendCommand('\x03'); // Ctrl-C
            await sendCommand('\x01'); // Ctrl-A
            await sendCommand('');     // Clear the input buffer

            // Prepare files to send
            const pythonCode = `import badger2040
import pngdec
import time, os

display = badger2040.Badger2040()
png = pngdec.PNG(display.display)

display.led(128)
display.clear()

try:
    png.open_file("badge.png")
    png.decode()
except (OSError, RuntimeError):
    print("Badge background error")

display.update()`;

            // Get canvas image data as binary
            const canvas = document.getElementById('badgeCanvas');
            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const imageArrayBuffer = await imageBlob.arrayBuffer();
            const imageUint8Array = new Uint8Array(imageArrayBuffer);

            // Send main.py
            await sendCommand(`f = open('main.py', 'w')`);
            const pythonLines = pythonCode.split('\n');
            for (const line of pythonLines) {
                await sendCommand(`f.write('${line}\\n')`);
            }
            await sendCommand(`f.close()`);

            // Send badge.png
            await sendCommand(`f = open('badge.png', 'wb')`);
            const chunkSize = 256;
            for (let i = 0; i < imageUint8Array.length; i += chunkSize) {
                const chunk = imageUint8Array.slice(i, i + chunkSize);
                const hexString = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join('');
                await sendCommand(`f.write(bytes.fromhex('${hexString}'))`);
            }
            await sendCommand(`f.close()`);

            // Reset device
            await sendCommand('import machine; machine.reset()'); // Reboot badge

            // Exit raw REPL mode
            await sendCommand('\x04'); // Ctrl-D

            // Close streams and port
            writer.close();
            await writableStreamClosed;
            reader.cancel();
            await readableStreamClosed;
            await port.close();

            //alert('Files transferred successfully!');
        } catch (error) {
            console.error('Error:', error);
            //alert('An error occurred while transferring files.');
        }
    } else {
        alert('Web Serial API not supported in this browser.');
    }
}
