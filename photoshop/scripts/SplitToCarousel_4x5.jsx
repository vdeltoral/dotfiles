#target photoshop
app.bringToFront();

(function SplitToCarousel_MaxRes_4x5() {
    var originalRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    var originalDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    try {
        var inFile = File.openDialog("Select an image to split");
        if (!inFile) return;

        var nStr = prompt("How many slides? (2–10)", "3");
        if (nStr === null) return;

        var n = parseInt(nStr, 10);
        if (isNaN(n) || n < 2) {
            alert("Enter an integer >= 2.");
            return;
        }

        var doc = app.open(inFile);

        var W = doc.width.value;
        var H = doc.height.value;

        // Desired master aspect for n slides, each vertical 4:5:
        // slide aspect = width/height = 4/5
        // master aspect = (n*4)/5
        var desiredAspect = (4.0 * n) / 5.0;
        var currentAspect = W / H;

        // 1) Center-crop to master aspect (no distortion)
        if (Math.abs(currentAspect - desiredAspect) > 0.0001) {
            if (currentAspect > desiredAspect) {
                // Too wide => crop width
                var newW = Math.floor(H * desiredAspect);
                var left = Math.floor((W - newW) / 2);
                doc.crop([left, 0, left + newW, H]); // [L,T,R,B]
            } else {
                // Too tall => crop height
                var newH = Math.floor(W / desiredAspect);
                var top = Math.floor((H - newH) / 2);
                doc.crop([0, top, W, top + newH]); // [L,T,R,B]
            }
        }

        // Refresh after crop
        W = doc.width.value;
        H = doc.height.value;

        // 2) Compute maximum possible per-tile resolution that fits
        var tileW = Math.floor(W / n);
        var tileH = Math.floor(tileW * 5 / 4);

        if (tileW <= 0 || tileH <= 0) {
            alert("Computed tile size is invalid. Check the input image dimensions.");
            doc.close(SaveOptions.DONOTSAVECHANGES);
            return;
        }

        // Clamp by height if needed
        if (tileH > H) {
            tileH = H;
            tileW = Math.floor(tileH * 4 / 5);
        }

        var usedW = tileW * n;
        var usedH = tileH;

        // 3) Final center-trim so slicing is exact and symmetric
        if (W !== usedW || H !== usedH) {
            var cropLeft = Math.floor((W - usedW) / 2);
            var cropTop  = Math.floor((H - usedH) / 2);
            doc.crop([cropLeft, cropTop, cropLeft + usedW, cropTop + usedH]);
        }

        // Refresh after final trim
        W = doc.width.value;
        H = doc.height.value;

        // 4) Export tiles left->right
        var outFolder = inFile.parent;
        var baseName = decodeURI(inFile.name).replace(/\.[^\.]+$/, "");

        for (var i = 0; i < n; i++) {
            var x0 = i * tileW;
            var x1 = x0 + tileW;

            var tmp = doc.duplicate(baseName + "_tmp_" + (i + 1), false);
            tmp.crop([x0, 0, x1, tileH]);

            // Name format: A_1_3.png, A_2_3.png, ... A_3_3.png
            var outFile = new File(outFolder.fsName + "/" + baseName + "_" + (i + 1) + "_" + n + ".png");

            tmp.saveAs(outFile, new PNGSaveOptions(), true, Extension.LOWERCASE);
            tmp.close(SaveOptions.DONOTSAVECHANGES);
        }

        doc.close(SaveOptions.DONOTSAVECHANGES);

        alert(
            "Done.\n" +
            "Slides: " + n + "\n" +
            "Each tile: " + tileW + "×" + tileH + " (4:5)\n" +
            "Folder: " + outFolder.fsName
        );

    } catch (e) {
        alert("Error: " + e);
    } finally {
        app.displayDialogs = originalDialogs;
        app.preferences.rulerUnits = originalRulerUnits;
    }
})();
