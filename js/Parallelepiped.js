function Parallelepiped(parameters, edgeDetector) {
	Shape.call(this, parameters, edgeDetector);
}

Parallelepiped.prototype = Object.create(Shape.prototype);
Parallelepiped.prototype.constructor = Parallelepiped;

Parallelepiped.prototype.align = function(x,y) {
	this.scene.remove(this.line);


	var points = [];
	points.push(this.line.geometry.vertices[0]);
	points.push(this.line.geometry.vertices[1]);
	points.push(new THREE.Vector3(x,y,-500));
	
	if(!this.constantRadius) {
		this.leftEdges = new THREE.Points(new THREE.Geometry(), new THREE.PointsMaterial( { color: 0x000000, depthTest: false, depthWrite: false, size: 3 } ));
		this.rightEdges = new THREE.Points(new THREE.Geometry(), new THREE.PointsMaterial( { color: 0xff7700, depthTest: false, depthWrite: false, size: 3 } ));
		this.centers = [];
		this.centers.push(this.center);
		this.leftEdges.geometry.vertices.push(this.line.geometry.vertices[0]);
		this.rightEdges.geometry.vertices.push(this.line.geometry.vertices[2]);

		this.edgeDetector.dx = points[2].x - points[0].x;
		this.edgeDetector.dy = points[2].y - points[0].y;

		this.dist = points[0].distanceTo(points[2]);
	}

	this.frame.u.subVectors(points[0], points[1]);
	this.frame.v.subVectors(points[2], points[1]);

	var u_squared = this.frame.u.length()**2;
	var v_squared = this.frame.v.length()**2;
	var delta = (u_squared - v_squared)**2 + 4*this.frame.u.dot(this.frame.v)**2; //discriminant of the quadratic equation

	var L = ( u_squared + v_squared + Math.sqrt(delta) ) / 2.; // area (side squared) of the square

	this.frame.u.z = - Math.sqrt( L - u_squared );
	this.frame.v.z = - Math.sqrt( L - v_squared );

	points[0].z += this.frame.u.z;
	points[2].z += this.frame.v.z;
	this.last.copy(points[2]); 

	this.frame.u.normalize();
	this.frame.v.normalize();
	this.frame.w.crossVectors(this.frame.u,this.frame.v);

	var l = Math.sqrt(L);
	this.mesh.geometry = new THREE.BoxGeometry( l, l, 1 );

	this.mesh.position.addVectors(points[2], points[0]).divideScalar(2);
	this.center.copy(this.mesh.position);

	this.normal = new THREE.Vector3();
	this.normal.subVectors(points[1], this.center).normalize();

	this.diag = new THREE.Vector3();
	this.diag.subVectors(points[2], points[0]).normalize();


	//first, align an edge of the square with frame.u
	var q = new THREE.Quaternion();
	q.setFromUnitVectors(new THREE.Vector3(0,1,0), this.frame.u);

	this.mesh.applyQuaternion(q);

	//then, align the other with frame.v
	q.setFromUnitVectors((new THREE.Vector3(1,0,0)).applyQuaternion(q), this.frame.v);

	this.mesh.applyQuaternion(q);

	this.box = this.mesh;

	return this.mesh;
};

Parallelepiped.prototype.sweepConstant = function(x,y) {
	var direction = new THREE.Vector3(x - this.last.x, y - this.last.y, 0);
	var height = this.frame.w.dot(direction);
	direction.normalize();

	height /= Math.sqrt(1 - this.frame.w.z**2);
	var vec = this.frame.w.clone();

	this.mesh.position.addVectors(this.center, vec.multiplyScalar(height/2));

	var q = new THREE.Quaternion();
	var w = new THREE.Vector3();
	w.crossVectors(this.frame.u,this.frame.v);
	w.z = 0;
	if(w.dot(direction) > 0.999 || w.dot(direction) < -0.999) {
		w = new THREE.Vector3(this.frame.w.x, this.frame.w.y, 0);
		w.normalize();
		q.setFromUnitVectors(w, direction);
		this.mesh.applyQuaternion(q);
		this.frame.w.applyQuaternion(q);
	}
	var l = this.mesh.geometry.parameters.width;
	this.mesh.geometry = new THREE.BoxGeometry( l, l, Math.abs(height) );
};

Parallelepiped.prototype.sweepVarying = function(x,y) {
	var direction = new THREE.Vector3(x - this.last.x, y - this.last.y, 0);
	var height = this.frame.w.dot(direction);
	direction.normalize();

	height /= Math.sqrt(1 - this.frame.w.z**2);
	var vec = this.frame.w.clone();

	var curPoint = new THREE.Vector3();
	curPoint.addVectors(this.center, vec.multiplyScalar(height));

	var h = curPoint.distanceTo( this.centers[this.centers.length - 1] );

	var vec = this.frame.w.clone();
	this.box.position.addVectors(this.centers[this.centers.length - 1], vec.multiplyScalar(- h/2 )); // frame.w is facing downwards

	var l = this.box.geometry.parameters.width;
	this.box.geometry = new THREE.BoxGeometry( l, l, h );
	if(h > 2) {
		this.centers.push(curPoint);
		
		var edges = this.edgeDetector.bresenham(curPoint, this.dist);

		var l = edges.radius * Math.sqrt( 2 / ( this.diag.x**2 + this.diag.y**2 ) );

		if(this.mesh === this.box) {
			// swap vertices
			this.mesh.geometry.vertices[0].copy(this.mesh.geometry.vertices[4]);
			this.mesh.geometry.vertices[2].copy(this.mesh.geometry.vertices[6]);

			var geometry = new THREE.BoxGeometry(l, l, 1);

			for (var i = 0; i < geometry.vertices.length; i++) {
				geometry.vertices[i].z = - this.mesh.geometry.vertices[0].z;
			}

			this.mesh.geometry.vertices[4].copy(geometry.vertices[0]);
			this.mesh.geometry.vertices[5].copy(geometry.vertices[5]);
			this.mesh.geometry.vertices[6].copy(geometry.vertices[2]);
			this.mesh.geometry.vertices[7].copy(geometry.vertices[7]);

			// reindex them
			for(var i = 0; i < this.mesh.geometry.faces.length; i++) {
				if(this.mesh.geometry.faces[i].a == 0) this.mesh.geometry.faces[i].a = 4;
				else if(this.mesh.geometry.faces[i].a == 4) this.mesh.geometry.faces[i].a = 0;
				else if(this.mesh.geometry.faces[i].a == 2) this.mesh.geometry.faces[i].a = 6;
				else if(this.mesh.geometry.faces[i].a == 6) this.mesh.geometry.faces[i].a = 2;

				if(this.mesh.geometry.faces[i].b == 0) this.mesh.geometry.faces[i].b = 4;
				else if(this.mesh.geometry.faces[i].b == 4) this.mesh.geometry.faces[i].b = 0;
				else if(this.mesh.geometry.faces[i].b == 2) this.mesh.geometry.faces[i].b = 6;
				else if(this.mesh.geometry.faces[i].b == 6) this.mesh.geometry.faces[i].b = 2;

				if(this.mesh.geometry.faces[i].c == 0) this.mesh.geometry.faces[i].c = 4;
				else if(this.mesh.geometry.faces[i].c == 4) this.mesh.geometry.faces[i].c = 0;
				else if(this.mesh.geometry.faces[i].c == 2) this.mesh.geometry.faces[i].c = 6;
				else if(this.mesh.geometry.faces[i].c == 6) this.mesh.geometry.faces[i].c = 2;
			}

			this.mesh.geometry.faces.splice(8, 2); // remove front face

			this.mesh.geometry.verticesNeedUpdate = true;
			this.mesh.geometry.elementsNeedUpdate = true;



		} else {

			var vertices = this.mesh.geometry.vertices;
			var faces = this.mesh.geometry.faces;
			var n = this.mesh.geometry.vertices.length;


			var geometry = new THREE.BoxGeometry(l, l, 1);

			for (var i = 0; i < geometry.vertices.length; i++) {
				geometry.vertices[i].z = - (height - vertices[0].z);
			}

			vertices.push(geometry.vertices[0]);
			vertices.push(geometry.vertices[5]);
			vertices.push(geometry.vertices[2]);
			vertices.push(geometry.vertices[7]);

			// right side
			faces.push(new THREE.Face3(n, n+2, n-4));
			faces.push(new THREE.Face3(n-4, n+2, n-2));
			// top
			faces.push(new THREE.Face3(n-3, n+1, n-4));
			faces.push(new THREE.Face3(n-4, n+1, n));
			// bottom
			faces.push(new THREE.Face3(n+3, n-1, n+2));
			faces.push(new THREE.Face3(n+2, n-1, n-2));
			// left side
			faces.push(new THREE.Face3(n+3, n+1, n-1));
			faces.push(new THREE.Face3(n-1, n+1, n-3));

			this.scene.remove(this.box);
			this.mesh.geometry = new THREE.Geometry();
			this.mesh.geometry.vertices = vertices;
			this.mesh.geometry.faces = faces;

			this.mesh.geometry.computeFaceNormals();
			this.mesh.geometry.computeVertexNormals();
		}

		this.box = new THREE.Mesh();
		this.box.material = this.mesh.material;
		this.box.geometry = new THREE.BoxGeometry(l, l, 0.1);
		this.box.position.copy(curPoint);

		//first, align an edge of the square with frame.u
		var q = new THREE.Quaternion();
		q.setFromUnitVectors(new THREE.Vector3(0,1,0), this.frame.u);

		this.box.applyQuaternion(q);

		//then, align the other with frame.v
		q.setFromUnitVectors((new THREE.Vector3(1,0,0)).applyQuaternion(q), this.frame.v);

		this.box.applyQuaternion(q);


		this.scene.add(this.box);


		if(edges.left !== undefined) this.leftEdges.geometry.vertices.push( edges.left );
		if(edges.right !== undefined) this.rightEdges.geometry.vertices.push( edges.right );

		if(edges.left !== undefined && edges.right !== undefined) {
			if(Math.abs(height) / this.box.geometry.parameters.width > 2) { // means that the box is thin, so the error due to the orientation is big
				var middle = new THREE.Vector3();
				middle.addVectors(edges.left, edges.right).divideScalar(2);
				var dir = new THREE.Vector3();
				dir.subVectors(middle, this.center);
				dir.z = 0;
				dir.normalize();

				var w = height > 0 ? new THREE.Vector3(this.frame.w.x, this.frame.w.y, 0) : new THREE.Vector3(-this.frame.w.x, -this.frame.w.y, 0);
				w.normalize();
				var q = new THREE.Quaternion();
				q.setFromUnitVectors(w, dir);
				this.mesh.applyQuaternion(q);
				this.frame.w.applyQuaternion(q);
			}
		}

		this.dist = edges.radius;
	}
};

Parallelepiped.prototype.trace = function(x,y) {
	this.line.geometry.vertices[2] = new THREE.Vector3(x,y,-500);
	this.line.geometry.verticesNeedUpdate = true;
};

Parallelepiped.prototype.addPoint = function(x,y) {
	var geom = new THREE.Geometry();
	geom.vertices.push(new THREE.Vector3(x, y, -500));
	geom.vertices.push(new THREE.Vector3(x, y, -500));
	geom.vertices.push(new THREE.Vector3(x, y, -500));

	this.line = new THREE.Line(geom, new THREE.LineBasicMaterial(
		{color: 0x0077ff, linewidth: 3, depthTest: false, depthWrite: false}));
};

Parallelepiped.prototype.finalize = function() {
};