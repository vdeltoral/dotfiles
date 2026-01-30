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

        var pctStr = prompt("Foreground scale (% of background). Default 85.", "85");
        if (pctStr === null) return;

        var pct = parseFloat(pctStr);
        if (isNaN(pct) || pct <= 0 || pct > 1000) {
            alert("Enter a valid percentage (e.g. 85).");
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

        // Show color selection dialog
        var selectedColor = showColorSelectionDialog();
        if (selectedColor === null) return;

        var pctStr = prompt("Foreground scale (% of background). Default 85.", "85");
        if (pctStr === null) return;

        var pct = parseFloat(pctStr);
        if (isNaN(pct) || pct <= 0 || pct > 1000) {
            alert("Enter a valid percentage (e.g. 85).");
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

                var colorSuffix = "_" + selectedColor.name;
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
    function showColorSelectionDialog() {
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
            var percentLabel = (i === 0) ? "White" : (i === 10) ? "Black" : (i * 10) + "% Gray";
            
            colors.push({
                r: value,
                g: value,
                b: value,
                hex: hexValue,
                label: percentLabel,
                name: (i === 0) ? "white" : (i === 10) ? "black" : "gray" + (i * 10)
            });
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
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function componentToHex(c) {
        var hex = c.toString(16).toUpperCase();
        return hex.length === 1 ? "0" + hex : hex;
    }

    function showBatchSummary(processedFiles, errorFiles, totalFiles, folderPath) {
        var message = "Batch Complete!\n\n";
        message += "Processed: " + processedFiles.length + " of " + totalFiles + " files\n\n";
        
        if (processedFiles.length > 0) {
            message += "Successfully created:\n";
            for (var p = 0; p < Math.min(processedFiles.length, 10); p++) {
                message += "- " + processedFiles[p] + "\n";
            }
            if (processedFiles.length > 10) {
                message += "... and " + (processedFiles.length - 10) + " more\n";
            }
        }
        
        if (errorFiles.length > 0) {
            message += "\nErrors:\n";
            for (var e = 0; e < errorFiles.length; e++) {
                message += "- " + errorFiles[e] + "\n";
            }
        }
        
        message += "\nSaved to: " + folderPath;
        alert(message);
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