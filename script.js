// NEW CODE

var successCount = 0;
var fontSize = 8;


function resetFont() {
    fontSize = 8;
    successCount = 0;
    document.getElementById("smalltext").style.fontSize = fontSize + "px";
}

// if user is on mobile resolution
if (window.matchMedia("(max-width: 500px)").matches) {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var picture_canvas = document.getElementById("picture_canvas");
    picture_canvas.width = width;
    picture_canvas.height = height;
} else {
    var width = 640;
    var height = 480;
}

var color_choices = [
    "#C7FC00",
    "#FF00FF",
    "#8622FF",
    "#FE0056",
    "#00FFCE",
    "#FF8000",
    "#00B7EB",
    "#FFFF00",
    "#0E7AFE",
    "#FFABAB",
    "#0000FF",
    "#CCCCCC",
];

var available_model = {
    "name": "enhanced-driver-drowsiness-detection-via-deep-learning-qy7p2",
    "version": 3,
    "video": "",
    "confidence": 0.85,
    "model": null
};

// populate model select
var current_model_name = "enhanced-driver-drowsiness-detection-via-deep-learning-qy7p2";
const API_KEY = "rf_U7AD2Mxh39N7jQ3B6cP8xAyufLH3";
const DETECT_API_KEY = "4l5zOVomQmkAqlTJPVKN";
const CAMERA_ACCESS_URL = "https://uploads-ssl.webflow.com/5f6bc60e665f54545a1e52a5/63d40cd1de273045d359cf9a_camera-access2.png";
const LOADING_URL = "https://uploads-ssl.webflow.com/5f6bc60e665f54545a1e52a5/63d40cd2210b56e0e33593c7_loading-camera2.gif";
var current_model_version = 3;
var webcamLoop = false;

// when user scrolls past #model-select, stop webcam
window.addEventListener("scroll", function() {
    if (window.scrollY > 100) {
        webcamLoop = false;
    }
    // if comes back up, start webcam
    if (window.scrollY < 100) {
        webcamLoop = true;
    }
});

async function apiRequest (image) {
    var version = available_model["version"];
    var name = current_model_name;

    var url = "https://detect.roboflow.com/" + name + "/" + version + "?api_key=" + DETECT_API_KEY;
    
    // no cors
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: image,
        //mode: "no-cors",
        redirect: "follow",
    }).then((response) => response.json()
    ).then(resJson => { return resJson["predictions"] });
}

async function getModel() {

    var model = await roboflow
    .auth({
        publishable_key: API_KEY,
    })
    .load({
        model: current_model_name,
        version: current_model_version,
    });

    model.configure({
        threshold: available_model["confidence"],
        max_objects: 50
    });

    return model;
}

var model = null;

document
    .getElementById("webcam-predict")
    .addEventListener("click", function () {
    document.getElementById("resetFont").style.display = "block";
    document.getElementById("webcam-predict").style.display = "none";
    document.getElementById("picture_canvas").style.display = "block";
    webcamInference();
    });

var bounding_box_colors = {};


function setImageState(src, canvas = "picture_canvas") {
    var canvas = document.getElementById(canvas);
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.style.width = width + "px";
    img.style.height = height + "px";
    img.height = height;
    img.width = width;
    img.onload = function () {
    ctx.drawImage(img, 0, 0, width, height, 0, 0, width, height);
    };
}

function drawBoundingBoxes(predictions, canvas, ctx, scalingRatio, sx, sy, fromDetectAPI = false) {
    for (var i = 0; i < predictions.length; i++) {
        var confidence = predictions[i].confidence;
        ctx.scale(1, 1);

        if (predictions[i].class in bounding_box_colors) {
            ctx.strokeStyle = bounding_box_colors[predictions[i].class];
        } else {
            // random color
            var color =
            color_choices[Math.floor(Math.random() * color_choices.length)];
            ctx.strokeStyle = color;
            // remove color from choices
            color_choices.splice(color_choices.indexOf(color), 1);

            bounding_box_colors[predictions[i].class] = color;
        }

        var prediction = predictions[i];
        var x = prediction.bbox.x - prediction.bbox.width / 2;
        var y = prediction.bbox.y - prediction.bbox.height / 2;
        var width = prediction.bbox.width;
        var height = prediction.bbox.height;

        if (!fromDetectAPI) {
            x -= sx;
            y -= sy;

            x *= scalingRatio;
            y *= scalingRatio;
            width *= scalingRatio;
            height *= scalingRatio;
        }

        // if box is partially outside 640x480, clip it
        if (x < 0) {
            width += x;
            x = 0;
        }

        if (y < 0) {
            height += y;
            y = 0;
        }

        // if first prediction, double label size


        ctx.rect(x, y, width, width);

        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fill();

        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = "4";
        ctx.strokeRect(x, y, width, height);
        // put colored background on text
        var text = ctx.measureText(
            prediction.class + " " + Math.round(confidence * 100) + "%"
        );
        // if (i == 0) {
        //     text.width *= 2;
        // }

        // set x y fill text to be within canvas x y, even if x is outside
        // if (y < 0) {
        //     y = -40;
        // }
        if (y < 20) {
            y = 30
        }

        // make sure label doesn't leave canvas

        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(x - 2, y - 30, text.width + 4, 30);
        // use monospace font
        ctx.font = "15px monospace";
        // use black text
        ctx.fillStyle = "black";

        ctx.fillText(
            Math.round(confidence * 100) + "%",
            x,
            y - 10
        );

        // NEW CODE
        successCount = successCount + 1;
        if (successCount > 10) {
            fontSize = fontSize + 1;
            document.getElementById("smalltext").style.fontSize = fontSize + "px";
            successCount = 0;
        }
    }

    // NEW CODE
    if(predictions.length == 0) {
        successCount = 0;
    }
}

function webcamInference() {
    setImageState(
        LOADING_URL,
        "video_canvas"
    );
    webcamLoop = true;
    // hide picture canvas, show video canvas
    document.getElementById("picture_canvas").style.display = "none";
    document.getElementById("video_canvas").style.display = "block";

    // if no model, load it
    if (model == null) {
        model = getModel();
    }

    if (
    document.getElementById("video1") &&
    document.getElementById("video1").style
    ) {
    document.getElementById("video1").style.display = "block";
    } else {
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then(function (stream) {
        // if video exists, show it
        // create video element
        var video = document.createElement("video");
        video.srcObject = stream;
        video.id = "video1";
        video.setAttribute("playsinline", "");
        video.play();

        video.height = height;
        video.style.height = height + "px";
        video.width = width;
        video.style.width = width + "px";

        var canvas = document.getElementById("video_canvas");
        var ctx = canvas.getContext("2d");

        ctx.scale(1, 1);

        video.addEventListener(
            "loadeddata",
            function () {
            var loopID = setInterval(function () {
        
                var [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, scalingRatio] =
                getCoordinates(video);
                model.then(function (model) {
                model.detect(video).then(function (predictions) {
                    ctx.drawImage(video, 0, 0, width, height, 0, 0, width, height);

                    ctx.beginPath();

                    drawBoundingBoxes(predictions, canvas, ctx, scalingRatio, sx, sy);
            
                    if (!webcamLoop) {
                        clearInterval(loopID);
                    }
                });
                });
            }, 1000 / 30);},
            false
        );
        })
        .catch(function (err) {
        // replace with img
        setImageState(
            CAMERA_ACCESS_URL
        );
        });
    }
}

function getCoordinates(img) {
    var dx = 0;
    var dy = 0;
    var dWidth = 640;
    var dHeight = 480;

    var sy;
    var sx;
    var sWidth = 0;
    var sHeight = 0;

    var imageWidth = img.width;
    var imageHeight = img.height;

    const canvasRatio = dWidth / dHeight;
    const imageRatio = imageWidth / imageHeight;

    // scenario 1 - image is more vertical than canvas
    if (canvasRatio >= imageRatio) {
        var sx = 0;
        var sWidth = imageWidth;
        var sHeight = sWidth / canvasRatio;
        var sy = (imageHeight - sHeight) / 2;
    } else {
    // scenario 2 - image is more horizontal than canvas
        var sy = 0;
        var sHeight = imageHeight;
        var sWidth = sHeight * canvasRatio;
        var sx = (imageWidth - sWidth) / 2;
    }

    var scalingRatio = dWidth / sWidth;

    if (scalingRatio == Infinity) {
        scalingRatio = 1;
    }

    return [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, scalingRatio];
}

function getBase64Image(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    var dataURL = canvas.toDataURL("image/jpeg");
    return dataURL;
}

function imageInference(e) {
    // replace canvas with image
    document.getElementById("picture").style.display = "none";
    document.getElementById("picture_canvas").style.display = "block";
    document.getElementById("video_canvas").style.display = "none";

    var canvas = document.getElementById("picture_canvas");
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.src = e.src;
    img.crossOrigin = "anonymous";

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    img.onload = function () {
        setImageState(
            LOADING_URL,
            "picture_canvas"
        );
    var [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, scalingRatio] =
        getCoordinates(img);

    var base64 = getBase64Image(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

    apiRequest(base64).then(function (predictions) {
        ctx.beginPath();
        // draw image to canvas
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        var predictions = predictions.map(function (prediction) {
            return {
                bbox: { x: prediction.x, y: prediction.y, width: prediction.width, height: prediction.height},
                class: prediction.class,
                confidence: prediction.confidence,
        }});

        drawBoundingBoxes(predictions, canvas, ctx, scalingRatio, sx, sy, true);
    });
    };
}

function processDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    // hide #picture
    document.getElementById("picture").style.display = "none";
    document.getElementById("picture_canvas").style.display = "block";
    document.getElementById("video_canvas").style.display = "none";

    // clear canvas if necessary
    if (document.getElementById("picture_canvas").getContext) {
    var canvas = document.getElementById("picture_canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    var canvas = document.getElementById("picture_canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var file = e.dataTransfer.files[0];
    var reader = new FileReader();

    reader.readAsDataURL(file);

    // only allow png, jpeg, jpg
    if (
    file.type == "image/png" ||
    file.type == "image/jpeg" ||
    file.type == "image/jpg"
    ) {
    reader.onload = function (event) {
        var img = new Image();
        img.src = event.target.result;
        img.onload = function () {
        var [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, scalingRatio] =
            getCoordinates(img);
            setImageState(
                LOADING_URL,
                "picture_canvas"
            );


        model.then(function (model) {
            model.detect(img).then(function (predictions) {
                ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            ctx.beginPath();
            drawBoundingBoxes(predictions, canvas, ctx, scalingRatio, sx, sy);
            });
        });
        };
        document
        .getElementById("picture_canvas")
        .addEventListener("dragover", function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        document
        .getElementById("picture_canvas")
        .addEventListener("drop", processDrop);
    };
    }
}

