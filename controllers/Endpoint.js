class Endpoint {
	static hasValidParameter(parameter, parameters) {
		return (parameter in parameters && parameters[parameter]);
	}
}

module.exports = Endpoint;
