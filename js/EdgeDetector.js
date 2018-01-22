function EdgeDetector(fileName, scene) {
	this.scene = scene;
	this.fileName = fileName;
	this.bitmap = {};

	var texture = new THREE.TextureLoader().load( fileName + '.jpg' );

	if(texture.image.height <= window.innerHeight && texture.image.width <= window.innerWidth) {
		this.plane = new THREE.PlaneGeometry(texture.image.width, texture.image.height);
		this.warp = 1;
	} else {
		this.imageRatio = texture.image.width / texture.image.height;
		this.windowRatio = window.innerWidth / window.innerHeight;

		if(this.windowRatio < this.imageRatio) {
			this.plane = new THREE.PlaneGeometry(window.innerWidth, window.innerWidth / this.imageRatio);
			this.warp = texture.image.width / window.innerWidth;
		} else {
			this.plane = new THREE.PlaneGeometry(window.innerHeight * this.imageRatio, window.innerHeight);
			this.warp = texture.image.height / window.innerHeight;
		}
	}
	var material = new THREE.MeshBasicMaterial( { map: texture } );
	var image = new THREE.Mesh(this.plane, material);
	image.position.z = -999;
	scene.add(image);

	this.loadBmp();
}

EdgeDetector.prototype.loadBmp = function() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', this.fileName + '.bmp', true);
	xhr.responseType = 'arraybuffer';
	
	var bitmap = this.bitmap;
	xhr.onload = function(e) {
		// response is unsigned 8 bit integer
		var view = new DataView(this.response);
		bitmap.fileheader = {
			bfType: view.getUint16(0, true),
			bfSize: view.getUint32(2, true),
			bfReserved1: view.getUint16(6, true),
			bfReserved2: view.getUint16(8, true),
			bfOffBits: view.getUint32(10, true)
		};
		bitmap.infoheader = {
			biSize: view.getUint32(14, true),
			biWidth: view.getUint32(18, true),
			biHeight: view.getUint32(22, true),
			biPlanes: view.getUint16(26, true),
			biBitCount: view.getUint16(28, true),
			biCompression: view.getUint32(30, true),
			biSizeImage: view.getUint32(34, true),
			biXPxPerMeter: view.getUint32(38, true),
			biYPxPerMeter: view.getUint32(42, true),
			biClrUsed: view.getUint32(46, true),
			biClrImportant: view.getUint32(50, true)
		};
		var start = bitmap.fileheader.bfOffBits;  
		var width = bitmap.infoheader.biWidth;
		var height = bitmap.infoheader.biHeight;
		var stride = Math.floor((bitmap.infoheader.biBitCount * width + 31) / 32) * 4;

		bitmap.pixels = new Array(height);

		for (var x = 0; x < width; x++) {
			bitmap.pixels[x] = new Array(height);
		}
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var rg = view.getUint16(start + 3*x + stride*y, true);
				var b = view.getUint8(start + 3*x + 2 + stride*y, true);
				var hex = b + 256 * rg;
				bitmap.pixels[x][y] = new THREE.Color(hex);
			}
		}

	};
	 
	xhr.send();
};

EdgeDetector.prototype.bresenham = function(center, radius, dx, dy) {
	var width = this.bitmap.infoheader.biWidth;
	var height = this.bitmap.infoheader.biHeight;

	var centerX = Math.round(center.x * this.warp + width/2);
	var centerY = Math.round(center.y * this.warp + height/2);

	var u = new THREE.Vector3(dx, dy, 0).normalize();

	var leftX = Math.round((center.x - 0.8*radius * u.x)* this.warp + width/2);
	var leftY = Math.round((center.y - 0.8*radius * u.y)* this.warp + height/2);

	var rightX = Math.round((center.x + 0.8*radius * u.x)* this.warp + width/2);
	var rightY = Math.round((center.y + 0.8*radius * u.y)* this.warp + height/2);

	var minX = Math.min(0, (center.x - 1.2*radius * u.x)* this.warp + width/2);
	var minY =  Math.min(0, (center.y - 1.2*radius * u.y)* this.warp + height/2);

	var maxX = Math.max(width, (center.x + 1.2*radius * u.x)* this.warp + width/2);
	var maxY = Math.max(height, (center.y + 1.2*radius * u.y)* this.warp + height/2);

	var result = {};

	if(dx == 0) {
		var x = rightX;
		var y = rightY;

		while(y < maxY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			y++;
		}

		y = leftY;
		while(y > minY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			y--;
		}

		result.radius = result.left.distanceTo(result.right) / 2;
		return result;
	}

	if(dy == 0) {
		var x = rightX;
		var y = rightY;

		while(x < maxX) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			x++;
		}

		x = leftX;
		while(x > minX) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			x--;
		}

		result.radius = result.left.distanceTo(result.right) / 2;
		return result;
	}

	if(dy/dx > 1) {
		var err = (center.x + 0.8*radius * u.x)* this.warp + width/2 - rightX;

		var x = rightX, y = rightY;

		while(x < maxX && y < maxY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err += dx/dy;
			if(err >= 0.5) {
				x++;
				err -= 1;
			}
			y++;
		}

		err = leftX - ( (center.x - 0.8*radius * u.x)* this.warp + width/2 );

		x = leftX; y = leftY;
		while(x > minX && y > minY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err -= dx/dy;
			if(err < - 0.5) {
				x--;
				err += 1;
			}
			y--;
		}
	} else if(dy/dx > 0) {
		var err = (center.y + 0.8*radius * u.y)* this.warp + height/2 - rightY;

		var x = rightX, y = rightY;
		while(x < maxX && y < maxY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err += dy/dx;
			if(err >= 0.5) {
				y++;
				err -= 1;
			}
			x++;
		}

		err = leftY - ( (center.y - 0.8*radius * u.y)* this.warp + height/2 );

		x = leftX; y = leftY;
		while(x > minX && y > minY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err -= dy/dx;
			if(err < - 0.5) {
				y--;
				err += 1;
			}
			x--;
		}

	} else if(dy/dx > - 1) {
		var err = rightY - ( (center.y + 0.8*radius * u.y)* this.warp + height/2 );

		var x = rightX, y = rightY;
		while(x < maxX && y > minY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err += dy/dx;
			if(err < - 0.5) {
				y--;
				err += 1;
			}
			x++;
		}

		err = (center.y - 0.8*radius * u.y)* this.warp + height/2 - leftY;
		x = leftX; y = leftY;
		while(x > minX && y < maxY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err -= dy/dx;
			if(err > 0.5) {
				y++;
				err -= 1;
			}
			x--;
		}

	} else {
		var err = leftX - ( (center.x - 0.8*radius * u.x)* this.warp + width/2 );

		var x = rightX, y = rightY;
		while(x > minX && y < maxY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err += dy/dx;
			if(err < - 0.5) {
				x--;
				err += 1;
			}
			y++;
		}

		err = (center.x + 0.8*radius * u.x)* this.warp + width/2 - rightX;
		x = leftX; y = leftY;
		while(x < maxX && y > minY) {
			if( this.bitmap.pixels[x][y].r + this.bitmap.pixels[x][y].g + this.bitmap.pixels[x][y].b < 0.2 ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err -= dy/dx;
			if(err > 0.5) {
				x++;
				err -= 1;
			}
			y--;
		}

	}

	result.radius = result.left.distanceTo(result.right) / 2;
	return result;
}