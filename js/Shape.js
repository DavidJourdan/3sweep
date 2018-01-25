function Shape(parameters, edgeDetector) {
	this.scene = edgeDetector.scene;

	this.group = [];

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

	this.edgeDetector = edgeDetector;
}

Shape.prototype.align = function(x,y) {
};

Shape.prototype.sweep = function(x,y) {
	if(this.constantRadius) {
		this.sweepConstant(x,y);
	} else this.sweepVarying(x,y);
};

Shape.prototype.arrowHelpers = function() {
	var helpers = [];
	helpers[0] = new THREE.ArrowHelper( this.frame.u, this.center, 100);
	helpers[1] = new THREE.ArrowHelper( this.frame.v, this.center, 100);
	helpers[2] = new THREE.ArrowHelper( this.frame.w, this.center, 100, 0x00ffff);
	return helpers;
};

