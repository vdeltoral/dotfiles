#target photoshop
app.bringToFront();

(function FrameOverlay_Compositor() {
    var originalRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    var originalDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    try {
        // Show initial choice dialog
        var pathChoice = showPathSelectionDialog();
        if (pathChoice === null) return;

        if (pathChoice === "imageBackground") {
            runPathA_ImageBackground();
        } else if (pathChoice === "colorBackground") {
            runPathB_ColorBackground();
        }

    } catch (e) {
        alert("Error: " + e);
    } finally {
        app.displayDialogs = originalDialogs;
        app.preferences.rulerUnits = originalRulerUnits;
    }

    // ========== PATH SELECTION DIALOG ==========
    function showPathSelectionDialog() {
        var win = new Window("dialog", "Frame Compositor - Select Method");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        // Instructions
        var infoGroup = win.add("panel", undefined, "Choose your framing method:");
        infoGroup.orientation = "column";
        infoGroup.alignChildren = ["left", "top"];
        infoGroup.margins = 15;
        
        var info = infoGroup.add("statictext", undefined, "Path A: Use an existing image as the background/frame", {multiline: true});
        info.preferredSize.width = 350;
        
        var info2 = infoGroup.add("statictext", undefined, "Path B: Create a solid color background (grayscale options)", {multiline: true});
        info2.preferredSize.width = 350;

        // Button group
        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignChildren = ["center", "center"];
        btnGroup.spacing = 10;

        var pathABtn = btnGroup.add("button", undefined, "Path A: Image Background");
        pathABtn.preferredSize.width = 170;
        
        var pathBBtn = btnGroup.add("button", undefined, "Path B: Color Background");
        pathBBtn.preferredSize.width = 170;

        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        var result = null;

        pathABtn.onClick = function() {
            result = "imageBackground";
            win.close();
        };

        pathBBtn.onClick = function() {
            result = "colorBackground";
            win.close();
        };

        cancelBtn.onClick = function() {
            result = null;
            win.close();
        };

        win.show();
        return result;
    }

    // ========== PATH A: IMAGE BACKGROUND ==========
    function runPathA_ImageBackground() {
        var bgFile = File.openDialog("Select BACKGROUND image");
        if (!bgFile) return;

        var fgFiles = File.openDialog("Select FRAMED (foreground) image(s)", undefined, true);
        if (!fgFiles) return;
        
        // Ensure fgFiles is always an array
        if (!(fgFiles instanceof Array)) {
            fgFiles = [fgFiles];
        }

        var pctStr = prompt("Foreground scale (% of background). Default 80.", "80");
        if (pctStr === null) return;

        var pct = parseFloat(pctStr);
        if (isNaN(pct) || pct <= 0 || pct > 1000) {
            alert("Enter a valid percentage (e.g. 80).");
            return;
        }

        // Get background file info for output
        var folder = bgFile.parent;
        var bgName = decodeURI(bgFile.name);
        var bgDot = bgName.lastIndexOf(".");
        var ext = (bgDot >= 0) ? bgName.substring(bgDot + 1).toLowerCase() : "";

        var processedFiles = [];
        var errorFiles = [];

        // Process each foreground file
        for (var i = 0; i < fgFiles.length; i++) {
            var fgFile = fgFiles[i];
            
            try {
                // Open BG (destination)
                app.bringToFront();
                var bgDoc = app.open(bgFile);
                app.activeDocument = bgDoc;

                // Place FG into BG as embedded smart object
                placeEmbedded(fgFile);

                // The placed layer should now be the active layer
                var fgLayer = bgDoc.activeLayer;
                fgLayer.name = "Framed_Image";

                // Scale around center + center on canvas
                fgLayer.resize(pct, pct, AnchorPosition.MIDDLECENTER);

                var b = fgLayer.bounds;
                var l = b[0].value, t = b[1].value, r = b[2].value, bt = b[3].value;

                var layerCX = (l + r) / 2.0;
                var layerCY = (t + bt) / 2.0;

                var docCX = bgDoc.width.value / 2.0;
                var docCY = bgDoc.height.value / 2.0;

                fgLayer.translate(docCX - layerCX, docCY - layerCY);

                // Save with FG file name + _framed
                var fgName = decodeURI(fgFile.name);
                var dot = fgName.lastIndexOf(".");
                var baseName = (dot >= 0) ? fgName.substring(0, dot) : fgName;

                var outFile = new File(folder.fsName + "/" + baseName + "_framed." + ext);
                saveLikeBackground(bgDoc, outFile, ext);

                // Close without saving over the original BG
                bgDoc.close(SaveOptions.DONOTSAVECHANGES);
                
                processedFiles.push(outFile.name);
                
            } catch (innerError) {
                errorFiles.push(fgFile.name + ": " + innerError);
                if (bgDoc) {
                    bgDoc.close(SaveOptions.DONOTSAVECHANGES);
                }
            }
        }

        // Show summary
        showBatchSummary(processedFiles, errorFiles, fgFiles.length, folder.fsName);
    }

    // ========== PATH B: COLOR BACKGROUND ==========
    function runPathB_ColorBackground() {
        var fgFiles = File.openDialog("Select FOREGROUND image(s) to frame", undefined, true);
        if (!fgFiles) return;
        
        // Ensure fgFiles is always an array
        if (!(fgFiles instanceof Array)) {
            fgFiles = [fgFiles];
        }

        // Extract prominent colors from the first image
        var prominentColors = extractProminentColors(fgFiles[0]);
        
        // Show color selection dialog with grayscale + prominent colors
        var selectedColor = showColorSelectionDialog(prominentColors);
        if (selectedColor === null) return;

        var pctStr = prompt("Foreground scale (% of background). Default 80.", "80");
        if (pctStr === null) return;

        var pct = parseFloat(pctStr);
        if (isNaN(pct) || pct <= 0 || pct > 1000) {
            alert("Enter a valid percentage (e.g. 80).");
            return;
        }

        var processedFiles = [];
        var errorFiles = [];
        
        // Get first foreground file to determine output location
        var folder = fgFiles[0].parent;

        // Process each foreground file
        for (var i = 0; i < fgFiles.length; i++) {
            var fgFile = fgFiles[i];
            
            try {
                // Open foreground image first to get dimensions
                app.bringToFront();
                var fgDoc = app.open(fgFile);
                var fgWidth = fgDoc.width.value;
                var fgHeight = fgDoc.height.value;
                fgDoc.close(SaveOptions.DONOTSAVECHANGES);

                // Calculate background dimensions
                // pct is what % the foreground will be of the background
                // Example: if pct=85, foreground will be 85% of background size
                var bgWidth = Math.round(fgWidth / (pct / 100));
                var bgHeight = Math.round(fgHeight / (pct / 100));

                // Create new document with selected color background
                var bgDoc = app.documents.add(bgWidth, bgHeight, 72, "ColorFrame_Temp", NewDocumentMode.RGB);
                
                // Fill background with selected color
                var bgLayer = bgDoc.activeLayer;
                bgDoc.selection.selectAll();
                var fillColor = new SolidColor();
                fillColor.rgb.red = selectedColor.r;
                fillColor.rgb.green = selectedColor.g;
                fillColor.rgb.blue = selectedColor.b;
                bgDoc.selection.fill(fillColor);
                bgDoc.selection.deselect();

                // Place FG into BG as embedded smart object
                placeEmbedded(fgFile);

                // The placed layer should now be the active layer
                var fgLayer = bgDoc.activeLayer;
                fgLayer.name = "Framed_Image";

                // Photoshop auto-scales placed images to fit, so we need to scale back to original size
                // Get current size of placed layer
                var b = fgLayer.bounds;
                var currentWidth = b[2].value - b[0].value;
                var currentHeight = b[3].value - b[1].value;
                
                // Calculate scale needed to restore original dimensions
                var scaleX = (fgWidth / currentWidth) * 100;
                var scaleY = (fgHeight / currentHeight) * 100;
                
                // Scale back to original size
                fgLayer.resize(scaleX, scaleY, AnchorPosition.MIDDLECENTER);

                // Now center the layer on canvas
                b = fgLayer.bounds;
                var l = b[0].value, t = b[1].value, r = b[2].value, bt = b[3].value;

                var layerCX = (l + r) / 2.0;
                var layerCY = (t + bt) / 2.0;

                var docCX = bgDoc.width.value / 2.0;
                var docCY = bgDoc.height.value / 2.0;

                fgLayer.translate(docCX - layerCX, docCY - layerCY);

                // Flatten before saving
                bgDoc.flatten();

                // Save with FG file name + color suffix
                var fgName = decodeURI(fgFile.name);
                var dot = fgName.lastIndexOf(".");
                var baseName = (dot >= 0) ? fgName.substring(0, dot) : fgName;
                var ext = (dot >= 0) ? fgName.substring(dot + 1).toLowerCase() : "png";

                // Suffix: _white / _black for pure colors, _HEXCODE for everything else
                var colorSuffix;
                if (selectedColor.r === 255 && selectedColor.g === 255 && selectedColor.b === 255) {
                    colorSuffix = "_white";
                } else if (selectedColor.r === 0 && selectedColor.g === 0 && selectedColor.b === 0) {
                    colorSuffix = "_black";
                } else {
                    colorSuffix = "_" + rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b).substring(1).toUpperCase();
                }
                var outFile = new File(folder.fsName + "/" + baseName + colorSuffix + "." + ext);
                saveLikeBackground(bgDoc, outFile, ext);

                // Close without saving
                bgDoc.close(SaveOptions.DONOTSAVECHANGES);
                
                processedFiles.push(outFile.name);
                
            } catch (innerError) {
                errorFiles.push(fgFile.name + ": " + innerError);
                if (bgDoc) {
                    try { bgDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
                }
            }
        }

        // Show summary
        showBatchSummary(processedFiles, errorFiles, fgFiles.length, folder.fsName);
    }

    // ========== COLOR SELECTION DIALOG ==========
    function showColorSelectionDialog(prominentColors) {
        var win = new Window("dialog", "Select Frame Color");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        // Create grayscale colors (white to black in 10% increments)
        var colors = [];
        for (var i = 0; i <= 10; i++) {
            var value = Math.round(255 * (1 - i * 0.1));
            var hexValue = rgbToHex(value, value, value);
            var percentLabel;
            var colorName;
            if (i === 0) {
                percentLabel = "White";
                colorName = "white";
            } else if (i === 10) {
                percentLabel = "Black";
                colorName = "black";
            } else {
                percentLabel = (i * 10) + "% Gray";
                colorName = hexValue.substring(1); // hex digits, no #
            }
            
            colors.push({
                r: value,
                g: value,
                b: value,
                hex: hexValue,
                label: percentLabel,
                name: colorName
            });
        }

        // Add prominent colors from image
        if (prominentColors && prominentColors.length > 0) {
            for (var p = 0; p < prominentColors.length; p++) {
                colors.push(prominentColors[p]);
            }
        }

        // Create scrolling group for colors
        var colorPanel = win.add("panel", undefined, "Colors");
        colorPanel.alignChildren = ["fill", "top"];
        colorPanel.margins = 10;

        var selectedColor = null;

        // Create color buttons (3 per row)
        var row = null;
        for (var i = 0; i < colors.length; i++) {
            if (i % 3 === 0) {
                row = colorPanel.add("group");
                row.orientation = "row";
                row.spacing = 10;
                row.alignChildren = ["fill", "center"];
            }

            var colorGroup = row.add("group");
            colorGroup.orientation = "column";
            colorGroup.alignChildren = ["center", "top"];
            colorGroup.spacing = 5;

            // Visual color swatch (non-clickable panel)
            var swatch = colorGroup.add("panel");
            swatch.size = [80, 80];
            swatch.graphics.backgroundColor = swatch.graphics.newBrush(
                swatch.graphics.BrushType.SOLID_COLOR,
                [colors[i].r / 255, colors[i].g / 255, colors[i].b / 255]
            );

            // Clickable button below the swatch
            var colorBtn = colorGroup.add("button", undefined, colors[i].label + "\n" + colors[i].hex);
            colorBtn.preferredSize = [80, 50];
            
            // Store color data on the button
            colorBtn.colorData = colors[i];
            colorBtn.onClick = function() {
                selectedColor = this.colorData;
                win.close();
            };
        }

        // Cancel button
        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignment = "center";
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");
        cancelBtn.onClick = function() {
            selectedColor = null;
            win.close();
        };

        win.show();
        return selectedColor;
    }

    // ========== HELPER FUNCTIONS ==========
    function extractProminentColors(imageFile) {
        var prominentColors = [];
        
        try {
            // Open the image temporarily
            app.bringToFront();
            var tempDoc = app.open(imageFile);
            app.activeDocument = tempDoc;
            
            // Flatten to ensure we're sampling actual colors
            if (tempDoc.layers.length > 1) {
                tempDoc.flatten();
            }
            
            // Resize to smaller size for faster sampling
            var maxDim = 300;
            if (tempDoc.width.value > maxDim || tempDoc.height.value > maxDim) {
                var scale = maxDim / Math.max(tempDoc.width.value, tempDoc.height.value);
                tempDoc.resizeImage(
                    UnitValue(tempDoc.width.value * scale, "px"),
                    UnitValue(tempDoc.height.value * scale, "px")
                );
            }
            
            var sampledColors = [];
            var width = tempDoc.width.value;
            var height = tempDoc.height.value;
            
            // Sample 25 random points
            for (var i = 0; i < 25; i++) {
                var x = Math.floor(Math.random() * (width - 2)) + 1;
                var y = Math.floor(Math.random() * (height - 2)) + 1;
                
                try {
                    var sampler = tempDoc.colorSamplers.add([x, y]);
                    var color = {
                        r: Math.round(sampler.color.rgb.red),
                        g: Math.round(sampler.color.rgb.green),
                        b: Math.round(sampler.color.rgb.blue)
                    };
                    sampler.remove();
                    
                    // Only keep colorful colors (not grays)
                    var colorfulness = getColorfulness(color);
                    if (colorfulness > 25) {
                        sampledColors.push(color);
                    }
                } catch (e) {
                    // Skip this sample
                }
            }
            
            // Close the temp document
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
            
            // If we didn't get any colorful colors, return empty
            if (sampledColors.length === 0) {
                return prominentColors;
            }
            
            // Cluster similar colors
            var clusteredColors = clusterColors(sampledColors);
            
            // Return top 4 most prominent colors
            var maxColors = Math.min(4, clusteredColors.length);
            for (var c = 0; c < maxColors; c++) {
                var col = clusteredColors[c];
                prominentColors.push({
                    r: col.r,
                    g: col.g,
                    b: col.b,
                    hex: rgbToHex(col.r, col.g, col.b),
                    label: "Color " + (c + 1),
                    name: rgbToHex(col.r, col.g, col.b).substring(1) // hex digits, no #
                });
            }
            
        } catch (e) {
            // If color extraction fails, just return empty array
        }
        
        return prominentColors;
    }
    
    
    function clusterColors(colors) {
        if (colors.length === 0) return [];
        
        // Simple clustering: group similar colors together
        var clusters = [];
        var threshold = 40; // Color distance threshold
        
        for (var i = 0; i < colors.length; i++) {
            var color = colors[i];
            var foundCluster = false;
            
            // Check if this color belongs to an existing cluster
            for (var c = 0; c < clusters.length; c++) {
                var cluster = clusters[c];
                var dist = colorDistance(color, cluster.avgColor);
                
                if (dist < threshold) {
                    // Add to this cluster
                    cluster.colors.push(color);
                    cluster.avgColor = averageColor(cluster.colors);
                    foundCluster = true;
                    break;
                }
            }
            
            // If no cluster found, create new one
            if (!foundCluster) {
                clusters.push({
                    colors: [color],
                    avgColor: color
                });
            }
        }
        
        // Sort clusters by size (most common colors first)
        clusters.sort(function(a, b) {
            return b.colors.length - a.colors.length;
        });
        
        // Return the average colors
        var result = [];
        for (var c = 0; c < clusters.length; c++) {
            result.push(clusters[c].avgColor);
        }
        
        return result;
    }
    
    function getColorfulness(color) {
        // Measure how "colorful" a color is (i.e., how far from grayscale)
        // Returns the maximum difference between RGB channels
        var max = Math.max(color.r, color.g, color.b);
        var min = Math.min(color.r, color.g, color.b);
        return max - min;
    }
    
    function colorDistance(c1, c2) {
        // Euclidean distance in RGB space
        var dr = c1.r - c2.r;
        var dg = c1.g - c2.g;
        var db = c1.b - c2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    
    function averageColor(colors) {
        var sumR = 0, sumG = 0, sumB = 0;
        for (var i = 0; i < colors.length; i++) {
            sumR += colors[i].r;
            sumG += colors[i].g;
            sumB += colors[i].b;
        }
        return {
            r: Math.round(sumR / colors.length),
            g: Math.round(sumG / colors.length),
            b: Math.round(sumB / colors.length)
        };
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function componentToHex(c) {
        var hex = c.toString(16).toUpperCase();
        return hex.length === 1 ? "0" + hex : hex;
    }

    function showBatchSummary(processedFiles, errorFiles, totalFiles, folderPath) {
        var win = new Window("dialog", "Batch Complete");
        win.orientation = "column";
        win.alignChildren = ["center", "top"];
        win.spacing = 12;
        win.margins = 24;

        win.add("statictext", undefined, "Processed: " + processedFiles.length + " of " + totalFiles + " files");

        if (errorFiles.length > 0) {
            var errText = win.add("statictext", undefined, "Errors: " + errorFiles.length, {multiline: true});
            errText.preferredSize.width = 300;
        }

        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignChildren = ["center", "center"];
        btnGroup.spacing = 10;

        var okBtn = btnGroup.add("button", undefined, "OK");
        okBtn.onClick = function() { win.close(); };

        var openBtn = btnGroup.add("button", undefined, "Open Folder");
        openBtn.onClick = function() {
            Folder(folderPath).execute();
            win.close();
        };

        win.show();
    }

    function placeEmbedded(fileObj) {
        var idPlc = charIDToTypeID("Plc ");
        var desc = new ActionDescriptor();
        desc.putPath(charIDToTypeID("null"), fileObj);
        desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
        executeAction(idPlc, desc, DialogModes.NO);
    }

    function saveLikeBackground(doc, outFile, ext) {
        ext = (ext || "").toLowerCase();

        if (ext === "jpg" || ext === "jpeg") {
            var jpg = new JPEGSaveOptions();
            jpg.quality = 12;
            jpg.embedColorProfile = true;
            doc.saveAs(outFile, jpg, true, Extension.LOWERCASE);
            return;
        }

        if (ext === "png") {
            var png = new PNGSaveOptions();
            doc.saveAs(outFile, png, true, Extension.LOWERCASE);
            return;
        }

        if (ext === "tif" || ext === "tiff") {
            var tif = new TiffSaveOptions();
            tif.embedColorProfile = true;
            tif.imageCompression = TIFFEncoding.TIFFLZW;
            doc.saveAs(outFile, tif, true, Extension.LOWERCASE);
            return;
        }

        if (ext === "psd") {
            var psd = new PhotoshopSaveOptions();
            psd.embedColorProfile = true;
            doc.saveAs(outFile, psd, true, Extension.LOWERCASE);
            return;
        }

        // Fallback to PNG if unknown
        var fallback = new PNGSaveOptions();
        var fallbackFile = new File(outFile.fsName.replace(/\.[^\.]+$/, "") + ".png");
        doc.saveAs(fallbackFile, fallback, true, Extension.LOWERCASE);
    }
})();