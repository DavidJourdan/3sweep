function cov(x, y) {
	var sum = 0;
	var meanX = mean(x);
	var meanY = mean(y);
	for (var i = 0; i < x.length; i++) {
		sum += (x[i] - meanX)*(y[i] - meanY);
	}
	return sum;
}

function mean(x) {
	var n = x.length;
	var sum = 0;
	for (var i = 0; i < n; i++) {
		sum += x[i];
	}
	return sum / n;
}

function lin_regression(points) {
	var x = Array.from(points, v => v.x);
	var y = Array.from(points, v => v.y);
	var slope = cov(x,y) / cov(x,x);
	return slope;
}