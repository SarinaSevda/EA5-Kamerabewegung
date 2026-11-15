var recursiveSphere = (function () {
    var depth = 0;

    function setDepth(value) {
        depth = value;
    }

    function normalize(point) {

        var x = point[0];
        var y = point[1];
        var z = point[2];

        var length = Math.sqrt(
            x * x +
            y * y +
            z * z
        );

        return [
            x / length,
            y / length,
            z / length
        ];
    }

    function getMiddlePoint(a, b) {

        var middle = [
            (a[0] + b[0]) / 2,
            (a[1] + b[1]) / 2,
            (a[2] + b[2]) / 2
        ];

        return normalize(middle);
    }

    function divideTriangle(a, b, c, level, triangles) {
        if (level === 0) {

            triangles.push([
                a,
                b,
                c
            ]);
            return;
        }
        var ab = getMiddlePoint(a, b);
        var bc = getMiddlePoint(b, c);
        var ca = getMiddlePoint(c, a);

        divideTriangle(
            a,
            ab,
            ca,
            level - 1,
            triangles
        );
        divideTriangle(
            ab,
            b,
            bc,
            level - 1,
            triangles
        );
        divideTriangle(
            ca,
            bc,
            c,
            level - 1,
            triangles
        );
        divideTriangle(
            ab,
            bc,
            ca,
            level - 1,
            triangles
        );
    }

    function createVertexData() {
        var top = [0, 1, 0];
        var bottom = [0, -1, 0];

        var right = [1, 0, 0];
        var front = [0, 0, 1];
        var left = [-1, 0, 0];
        var back = [0, 0, -1];

        var seedTriangles = [
            [top, front, right],
            [top, left, front],
            [top, back, left],
            [top, right, back],

            [bottom, right, front],
            [bottom, front, left],
            [bottom, left, back],
            [bottom, back, right]
        ];
        var triangles = [];
        for (
            var i = 0;
            i < seedTriangles.length;
            i++
        ) {
            divideTriangle(
                seedTriangles[i][0],
                seedTriangles[i][1],
                seedTriangles[i][2],
                depth,
                triangles
            );
        }
        var numberOfTriangles =
            triangles.length;
        var numberOfVertices =
            numberOfTriangles * 3;
        this.vertices =
            new Float32Array(
                numberOfVertices * 3
            );
        this.normals =
            new Float32Array(
                numberOfVertices * 3
            );

        this.indicesTris =
            new Uint16Array(
                numberOfTriangles * 3
            );
        this.indicesLines =
            new Uint16Array(
                numberOfTriangles * 6
            );
        var vertexIndex = 0;
        var lineIndex = 0;
        var triIndex = 0;

        for (
            var t = 0;
            t < triangles.length;
            t++
        ) {

            var triangle =
                triangles[t];
            var firstVertex =
                vertexIndex;

            for (
                var j = 0;
                j < 3;
                j++
            ) {

                var p =
                    triangle[j];
                this.vertices[
                vertexIndex * 3
                    ] = p[0];
                this.vertices[
                vertexIndex * 3 + 1
                    ] = p[1];
                this.vertices[
                vertexIndex * 3 + 2
                    ] = p[2];
                this.normals[
                vertexIndex * 3
                    ] = p[0];
                this.normals[
                vertexIndex * 3 + 1
                    ] = p[1];
                this.normals[
                vertexIndex * 3 + 2
                    ] = p[2];

                this.indicesTris[
                    triIndex++
                    ] = vertexIndex;

                vertexIndex++;
            }
            this.indicesLines[
                lineIndex++
                ] = firstVertex;
            this.indicesLines[
                lineIndex++
                ] = firstVertex + 1;
            this.indicesLines[
                lineIndex++
                ] = firstVertex + 1;
            this.indicesLines[
                lineIndex++
                ] = firstVertex + 2;
            this.indicesLines[
                lineIndex++
                ] = firstVertex + 2;
            this.indicesLines[
                lineIndex++
                ] = firstVertex;
        }
    }
    return {
        createVertexData:
        createVertexData,
        setDepth:
        setDepth
    };
}());