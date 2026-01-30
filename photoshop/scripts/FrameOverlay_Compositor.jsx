#target photoshop
app.bringToFront();

(function FrameOverlay_Compositor() {
    var originalRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    var originalDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    try {
        var bgFile = File.openDialog("Select BACKGROUND image");
        if (!bgFile) return;

        var fgFile = File.openDialog("Select FRAMED (foreground) image");
        if (!fgFile) return;

        var pctStr = prompt("Foreground scale (% of background). Default 85.", "85");
        if (pctStr === null) return;

        var pct = parseFloat(pctStr);
        if (isNaN(pct) || pct <= 0 || pct > 1000) {
            alert("Enter a valid percentage (e.g. 85).");
            return;
        }

        // Open BG (destination)
        app.bringToFront();
        var bgDoc = app.open(bgFile);
        app.activeDocument = bgDoc;

        // Place FG into BG as embedded smart object (robust across file types)
        placeEmbedded(fgFile);

        // The placed layer should now be the active layer
        var fgLayer = bgDoc.activeLayer;
        fgLayer.name = "Framed_Image";

        // Scale around center + center on canvas
        fgLayer.resize(pct, pct, AnchorPosition.MIDDLECENTER);

        var b = fgLayer.bounds; // [L, T, R, B]
        var l = b[0].value, t = b[1].value, r = b[2].value, bt = b[3].value;

        var layerCX = (l + r) / 2.0;
        var layerCY = (t + bt) / 2.0;

        var docCX = bgDoc.width.value / 2.0;
        var docCY = bgDoc.height.value / 2.0;

        fgLayer.translate(docCX - layerCX, docCY - layerCY);

        // Save next to BG with same extension, suffix _framed
        var folder = bgFile.parent;
        var bgName = decodeURI(bgFile.name);
        var dot = bgName.lastIndexOf(".");
        var baseName = (dot >= 0) ? bgName.substring(0, dot) : bgName;
        var ext = (dot >= 0) ? bgName.substring(dot + 1).toLowerCase() : "";

        var outFile = new File(folder.fsName + "/" + baseName + "_framed." + ext);
        saveLikeBackground(bgDoc, outFile, ext);

        // Close without saving over the original BG
        bgDoc.close(SaveOptions.DONOTSAVECHANGES);

        alert("Done:\n" + outFile.fsName);

    } catch (e) {
        alert("Error: " + e);
    } finally {
        app.displayDialogs = originalDialogs;
        app.preferences.rulerUnits = originalRulerUnits;
    }

    // --- Place Embedded (Action Manager) ---
    function placeEmbedded(fileObj) {
        // Places a file as an embedded smart object into the active document (Place Embedded).
        // This avoids cross-document DOM duplication issues.
        var idPlc = charIDToTypeID("Plc ");
        var desc = new ActionDescriptor();

        desc.putPath(charIDToTypeID("null"), fileObj);

        // Some PS versions require these fields; keeping minimal tends to work broadly.
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
        var fallbackFile = new File(outFile.fsName.replace(/\.[^\.]+$/, "") + "_framed.png");
        doc.saveAs(fallbackFile, fallback, true, Extension.LOWERCASE);
    }
})();
