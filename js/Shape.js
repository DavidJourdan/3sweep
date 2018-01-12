function Shape(x, y, parameters, scene) {
	this.scene = scene;

	this.frame = {
		u: new THREE.Vector3(), 
		v: new THREE.Vector3(), 
		w: new THREE.Vector3()
	};

	this.constantRadius = parameters.constantRadius;
	this.straightAxis = parameters.straightAxis;

	var material = new THREE.MeshStandardMaterial({color: 0x0077ff});
	this.mesh = new THREE.Mesh( undefined, material );

	this.last = new THREE.Vector3(); //last specified point on the profile
	this.center = new THREE.Vector3(); //center of the profile

	var geom = new THREE.Geometry();
	geom.vertices.push(new THREE.Vector3(x, y, -500));
	geom.vertices.push(new THREE.Vector3(x, y, -500));
	this.line = new THREE.Line(geom, new THREE.LineBasicMaterial(
		{color: 0x0077ff, linewidth: 3, depthTest: false, depthWrite: false}));
}

Shape.prototype.align = function(x,y) {
};

Shape.prototype.sweep = function(x,y) {
	// body...	
};

Shape.prototype.arrowHelpers = function() {
	var helpers = [];
	helpers[0] = new THREE.ArrowHelper( this.frame.u, this.center, 100);
	helpers[1] = new THREE.ArrowHelper( this.frame.v, this.center, 100);
	helpers[2] = new THREE.ArrowHelper( this.frame.w, this.center, 100, 0x00ffff);
	return helpers;
};