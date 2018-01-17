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

EdgeDetector.prototype.bresenham = function(center, points) {
	var dx = points[1].x - points[0].x;
	var dy = points[1].y - points[0].y;

	var width = this.bitmap.infoheader.biWidth;
	var height = this.bitmap.infoheader.biHeight;

	var centerX = Math.round(center.x * this.warp + width/2);
	var centerY = Math.round(center.y * this.warp + height/2);

	var result = {};

	if(dx == 0) {
		var x = centerX;
		var y = centerY;

		while(y < height) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			y++;
		}

		y = centerY;
		while(y > 0) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			y--;
		}

		result.radius = result.left.distanceTo(result.right) / 2;
		return result;
	}

	if(dy == 0) {
		var x = centerX;
		var y = centerY;

		while(x < width) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			x++;
		}

		x = centerX;
		while(x > 0) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			x--;
		}

		result.radius = result.left.distanceTo(result.right) / 2;
		return result;
	}

	if(dy/dx > 1) {
		var err = center.x * this.warp + width/2 - centerX;

		var x = centerX, y = centerY;
		while(x < width && y < height) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err += dy/dx;
			if(err >= 0.5) {
				x++;
				err -= 1;
			}
			y++;
		}

		err = centerX - (center.x * this.warp + width/2);

		x = centerX; y = centerY;
		while(x > 0 && y > 0) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err -= dy/dx;
			if(err < - 0.5) {
				x--;
				err += 1;
			}
			y--;
		}
	} else if(dy/dx > 0) {
		var err = center.y * this.warp + height/2 - centerY;

		var x = centerX, y = centerY;
		while(x < width && y < height) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
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

		err = centerY - (center.y * this.warp + height/2);

		x = centerX; y = centerY;
		while(x > 0 && y > 0) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
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
		var err = centerY - (center.y * this.warp + height/2);

		var x = centerX, y = centerY;
		while(x < width && y > 0) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err -= dy/dx;
			if(err < - 0.5) {
				y--;
				err += 1;
			}
			x++;
		}

		err = center.y * this.warp + height/2 - centerY;
		x = centerX; y = centerY;
		while(x > 0 && y < height) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err += dy/dx;
			if(err > 0.5) {
				y++;
				err -= 1;
			}
			x--;
		}

	} else {
		var err = centerX - (center.x * this.warp + width/2);

		var x = centerX, y = centerY;
		while(x > 0 && y < height) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.right = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err -= dy/dx;
			if(err < - 0.5) {
				x--;
				err += 1;
			}
			y++;
		}

		err = center.x * this.warp + width/2 - centerX;
		x = centerX; y = centerY;
		while(x < width && y > 0) {
			if( this.bitmap.pixels[x][y].equals(new THREE.Color( 0x000000 )) ) {
				result.left = new THREE.Vector3( (x - height/2)/this.warp, (y - width/2)/this.warp, -500);
				break;
			}
			err += dy/dx;
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