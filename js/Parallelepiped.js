function Parallelepiped(x, y, parameters, scene) {
	Shape.call(this, x, y, parameters, scene);
	this.line.geometry.vertices.push(new THREE.Vector3(x, y, -500));
}

Parallelepiped.prototype = Object.create(Shape.prototype);
Parallelepiped.prototype.constructor = Parallelepiped;

Parallelepiped.prototype.align = function(x,y) {
	var points = [];
	points.push(this.line.geometry.vertices[0]);
	points.push(this.line.geometry.vertices[1]);
	points.push(new THREE.Vector3(x,y,-500));
	
	this.frame.u.subVectors(points[0], points[1]);
	this.frame.v.subVectors(points[2], points[1]);

	var u_squared = this.frame.u.length()**2;
	var v_squared = this.frame.v.length()**2;
	var delta = (u_squared - v_squared)**2 + 4*this.frame.u.dot(this.frame.v)**2; //discriminant of the quadratic equation

	var L = ( u_squared + v_squared + Math.sqrt(delta) ) / 2.; //area (size squared) of the square

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

	//first, align an edge of the square with frame.u
	var q = new THREE.Quaternion();
	q.setFromUnitVectors(new THREE.Vector3(0,1,0), this.frame.u);

	this.mesh.applyQuaternion(q);

	//then, align the other with frame.v
	q.setFromUnitVectors((new THREE.Vector3(1,0,0)).applyQuaternion(q), this.frame.v);

	this.mesh.applyQuaternion(q);

	return this.mesh;
};

Parallelepiped.prototype.sweep = function(x,y) {
	this.scene.remove(this.line);

	var height = this.frame.w.dot(new THREE.Vector3(x - this.last.x, y - this.last.y, 0));
	height /= Math.sqrt(1 - this.frame.w.z**2);
	var vec = this.frame.w.clone();

	this.mesh.position.addVectors(this.center, vec.multiplyScalar(height/2));

	// var q = new THREE.Quaternion();
	// q.setFromUnitVectors(new THREE.Vector3(this.frame.w.x, this.frame.w.y, 0), new THREE.Vector3(x - this.last.x, y - this.last.y, 0));
	// this.mesh.applyQuaternion(q);
	// this.frame.w.applyQuaternion(q);

	var l = this.mesh.geometry.parameters.width;
	this.mesh.geometry = new THREE.BoxGeometry( l, l, Math.abs(height) );
};

Parallelepiped.prototype.trace = function(x,y) {
	this.line.geometry.vertices[2] = new THREE.Vector3(x,y,-500);
	this.line.geometry.verticesNeedUpdate = true;
};