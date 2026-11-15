var app = (function () {

    var gl;
    var canvas;
    var prog;
    var models = [];
    var sphereModel;
    var recursionDepth = 0;
    var camera = {
        eye: [0, 1, 4],
        center: [0, 0, 0],
        up: [0, 1, 0],
        vMatrix: mat4.create(),
        pMatrix: mat4.create(),
        projectionType: "perspective",
        fovy: 60 * Math.PI / 180,
        aspect: 1,
        lrtb: 2,
        zAngle: 0,
        distance: 6
    };

    function start() {
        init();
        render();
    }

    function init() {
        initWebGL();
        initShaderProgram();
        initUniforms();
        initModels();
        initEventHandler();
        initPipeline();
    }

    function initWebGL() {
        canvas = document.getElementById("canvas");
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    }

    function initPipeline() {
        gl.clearColor(0.95, 0.95, 0.95, 1);
        gl.frontFace(gl.CCW);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(0.5, 0);
        gl.viewport(
            0,
            0,
            gl.viewportWidth,
            gl.viewportHeight
        );
        camera.aspect = gl.viewportWidth / gl.viewportHeight;
    }

    function initShaderProgram() {
        var vs = initShader(
            gl.VERTEX_SHADER,
            "vertexshader"
        );
        var fs = initShader(
            gl.FRAGMENT_SHADER,
            "fragmentshader"
        );
        prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.bindAttribLocation(
            prog,
            0,
            "aPosition"
        );
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(
            prog,
            gl.LINK_STATUS
        )) {
            console.log(
                "Shader-Link-Fehler: " +
                gl.getProgramInfoLog(prog)
            );
        }

        gl.useProgram(prog);
    }
    function initShader(shaderType, sourceTagId) {

        var shader =
            gl.createShader(shaderType);

        var shaderSource =
            document.getElementById(
                sourceTagId
            ).text;

        gl.shaderSource(
            shader,
            shaderSource
        );
        gl.compileShader(shader);
        if (!gl.getShaderParameter(
            shader,
            gl.COMPILE_STATUS
        )) {
            console.log(
                sourceTagId +
                ": " +
                gl.getShaderInfoLog(shader)
            );
            return null;
        }
        return shader;
    }

    function initUniforms() {
        prog.pMatrixUniform =
            gl.getUniformLocation(
                prog,
                "uPMatrix"
            );
        prog.mvMatrixUniform =
            gl.getUniformLocation(
                prog,
                "uMVMatrix"
            );
    }

    function initModels() {
        var fs = "fillwireframe";
        createModel("torus", fs, [-2.5, 0, 0]);
        recursiveSphere.setDepth(recursionDepth);
        sphereModel = createModel("recursiveSphere", fs, [0, 0, 0]);
        createModel("cone", fs, [2.5, 0, 0]);
    }

    function createModel(
        geometryname,
        fillstyle,
        translate
    ) {

        var model = {};
        model.fillstyle = fillstyle;
        model.translate = translate;
        initDataAndBuffers(
            model,
            geometryname
        );
        model.mvMatrix =
            mat4.create();
        models.push(model);
        return model;
    }
    function rebuildSphere() {

        gl.deleteBuffer(
            sphereModel.vboPos
        );
        gl.deleteBuffer(
            sphereModel.vboNormal
        );
        gl.deleteBuffer(
            sphereModel.iboLines
        );
        gl.deleteBuffer(
            sphereModel.iboTris
        );
        recursiveSphere.setDepth(
            recursionDepth
        );
        initDataAndBuffers(
            sphereModel,
            "recursiveSphere"
        );
        document.getElementById(
            "recLevel"
        ).textContent =
            recursionDepth;
        render();
    }

    function initDataAndBuffers(
        model,
        geometryname
    ) {
        window[geometryname]
            .createVertexData
            .apply(model);
        model.vboPos =
            gl.createBuffer();
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            model.vboPos
        );
        gl.bufferData(
            gl.ARRAY_BUFFER,
            model.vertices,
            gl.STATIC_DRAW
        );
        prog.positionAttrib =
            gl.getAttribLocation(
                prog,
                "aPosition"
            );
        gl.enableVertexAttribArray(
            prog.positionAttrib
        );
        model.vboNormal =
            gl.createBuffer();
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            model.vboNormal
        );
        gl.bufferData(
            gl.ARRAY_BUFFER,
            model.normals,
            gl.STATIC_DRAW
        );
        prog.normalAttrib =
            gl.getAttribLocation(
                prog,
                "aNormal"
            );
        gl.enableVertexAttribArray(
            prog.normalAttrib
        );
        model.iboLines =
            gl.createBuffer();
        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            model.iboLines
        );
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            model.indicesLines,
            gl.STATIC_DRAW
        );
        model.iboLines.numberOfElements =
            model.indicesLines.length;
        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            null
        );
        model.iboTris =
            gl.createBuffer();
        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            model.iboTris
        );
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            model.indicesTris,
            gl.STATIC_DRAW
        );
        model.iboTris.numberOfElements =
            model.indicesTris.length;
        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            null
        );
    }

    function initEventHandler() {
        window.onkeydown = function (evt) {
            var deltaRotate = Math.PI / 36;
            var deltaTranslate = 0.1;
            switch (evt.key) {
                case "ArrowLeft":
                    camera.zAngle -= deltaRotate;
                    evt.preventDefault();
                    break;
                case "ArrowRight":
                    camera.zAngle += deltaRotate;
                    evt.preventDefault();
                    break;
                case "ArrowUp":
                    camera.eye[1] += deltaTranslate;
                    evt.preventDefault();
                    break;
                case "ArrowDown":
                    camera.eye[1] -= deltaTranslate;
                    evt.preventDefault();
                    break;
                case "n":
                case "N":
                    if (evt.shiftKey) {
                        camera.distance -= deltaTranslate;
                        if (camera.distance < 1.5) {
                            camera.distance = 1.5;
                        }
                    } else {
                        camera.distance += deltaTranslate;
                    }
                    break;
            }
            render();
        };
        document.getElementById("recPlus").onclick = function () {
            if (recursionDepth < 5) {
                recursionDepth++;
                rebuildSphere();
            }
        };
        document.getElementById("recMinus").onclick = function () {
            if (recursionDepth > 0) {
                recursionDepth--;
                rebuildSphere();
            }
        };
    }

    function calculateCameraOrbit() {

        var x = 0;
        var z = 2;
        camera.eye[x] =
            camera.center[x];
        camera.eye[z] =
            camera.center[z];
        camera.eye[x] +=
            camera.distance *
            Math.sin(
                camera.zAngle
            );
        camera.eye[z] +=
            camera.distance *
            Math.cos(
                camera.zAngle
            );
    }
    function setProjection() {
        switch (
            camera.projectionType
            ) {
            case "ortho":
                var v =
                    camera.lrtb;
                mat4.ortho(
                    camera.pMatrix,
                    -v,
                    v,
                    -v,
                    v,
                    -10,
                    10
                );
                break;
            case "perspective":
                mat4.perspective(
                    camera.pMatrix,
                    camera.fovy,
                    camera.aspect,
                    1,
                    10
                );
                break;
        }
        gl.uniformMatrix4fv(
            prog.pMatrixUniform,
            false,
            camera.pMatrix
        );
    }

    function render() {
        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );
        setProjection();
        calculateCameraOrbit();
        mat4.lookAt(
            camera.vMatrix,
            camera.eye,
            camera.center,
            camera.up
        );
        for (
            var i = 0;
            i < models.length;
            i++
        ) {
            mat4.copy(
                models[i].mvMatrix,
                camera.vMatrix
            );
            mat4.translate(
                models[i].mvMatrix,
                models[i].mvMatrix,
                models[i].translate
            );
            gl.uniformMatrix4fv(
                prog.mvMatrixUniform,
                false,
                models[i].mvMatrix
            );
            draw(models[i]);
        }
    }
    function draw(model) {
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            model.vboPos
        );
        gl.vertexAttribPointer(
            prog.positionAttrib,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            model.vboNormal
        );
        gl.vertexAttribPointer(
            prog.normalAttrib,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        var fill =
            model.fillstyle.search(
                /fill/
            ) !== -1;
        if (fill) {
            gl.enableVertexAttribArray(
                prog.normalAttrib
            );
            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                model.iboTris
            );
            gl.drawElements(
                gl.TRIANGLES,
                model.iboTris
                    .numberOfElements,
                gl.UNSIGNED_SHORT,
                0
            );
        }
        var wireframe =
            model.fillstyle.search(
                /wireframe/
            ) !== -1;
        if (wireframe) {
            gl.disableVertexAttribArray(
                prog.normalAttrib
            );
            gl.vertexAttrib3f(
                prog.normalAttrib,
                -1,
                -1,
                -1
            );
            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                model.iboLines
            );
            gl.drawElements(
                gl.LINES,
                model.iboLines
                    .numberOfElements,
                gl.UNSIGNED_SHORT,
                0
            );
        }
    }
    return {
        start: start
    };
}());