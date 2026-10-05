
# Build Inspector API Documentation
## PC Build

| Endpoint         	| Method 	| Header       	| Parameter                                      	| Request Body                                                                                               	| Response Type 	| Responses                                                                     	| Status Codes       	| Description                                      	|
|------------------	|--------	|--------------	|------------------------------------------------	|------------------------------------------------------------------------------------------------------------	|---------------	|-------------------------------------------------------------------------------	|--------------------	|--------------------------------------------------	|
| cpu/get/{id}     	| GET    	| Auth: bearer 	| id: int \| string                              	| -                                                                                                          	| JSON          	| 200: obj, 401: null, 404: null                                                	| 200, 401, 404      	|                                                  	|
| build/cpu/{name} 	| GET    	| Auth: bearer 	| name: string                                   	| -                                                                                                          	| JSON          	| 200: obj, 401: null, 404: null                                                	| 200, 401, 404      	| name match: partial                              	|
| gpu/get/{id}     	| GET    	| Auth: bearer 	| id: int \| string                              	| -                                                                                                          	| JSON          	| 200: obj, 401: null, 404: null                                                	| 200, 401, 404      	|                                                  	|
| build/gpu/{name} 	| GET    	| Auth: bearer 	| name: string                                   	| -                                                                                                          	| JSON          	| 200: obj, 401: null, 404: null                                                	| 200, 401, 404      	| name match: partial                              	|
| build/ram/calc   	| POST   	| Auth: bearer 	| Name, CapacityGb, ClockSpeedMHz, Latency, Type 	| Name: string, CapacityGb: number, ClockSpeedMHz: number, Latency: string, Type: "DDR5" \| "DDR4" \| "DDR3" 	| JSON          	| 200: int, 400: null, 401: null                                                	| 200, 400, 401      	|                                                  	|
| build/score      	| POST   	| Auth: bearer 	| Gpu, Cpu, Ram                                  	| Gpu: string, Cpu: string, Ram: RamDto                                                                      	| JSON          	| 200: {score: int, message string}, 400, 401, 404: {score: 0, message: string} 	| 200, 400, 401, 404 	| name match: partial - return type: BuildResponse 	|
---
Per maggiori informazioni rivolgersi al sottoscritto
## Steam
| Endpoint                            	| Method 	| Header 	| Parameter            	| Request Body 	| Responses                           	| Status Codes 	| Description 	|
|-------------------------------------	|--------	|--------	|----------------------	|--------------	|-------------------------------------	|--------------	|-------------	|
| steam/game/getAppByAppid/:appid     	| GET    	| -      	| appid: int \| string 	| -            	| 200: GameDto[], 404: null           	| 200, 404     	| -           	|
| steam/game/getAppByAppName/:appname 	| GET    	| -      	| appname: string      	| -            	| 200: GameDto[], 404: null           	| 200, 404     	| -           	|
| steam/game/requirements/:appid      	| GET    	| -      	| appid: int \| string 	| -            	| 200: GameRequirementsDto, 404: null 	| 200, 404     	| -           	|

```
GameDto {
	type: string;
	name: string;
	steam_appid: number;
	required_age: number;
	is_free: boolean;
	dlc: number[];
	detailed_description: string;
	about_the_game: string;
	short_description: string;
	supported_languages: string;
	header_image: string;
	capsule_image: string;
	capsule_imagev5: string;
	website: string;
	pc_requirements: {
		minimum: string;
	};
	mac_requirements: {
		minimum: string;
	};
	linux_requirements: {
			minimum: string;
	};
	developers: string[];
	publishers: string[];
	packages: number[];
	package_groups: {
		name: string;
		title: string;
		description: string;
		selection_text: string;
		save_text: string;
		display_type: number;
		is_recurring_subscription: string;
		subs: {
			packageid: number;
			percent_savings_text: string;
			percent_savings: number;
			option_text: string;
			option_description: string;
			can_get_free_license: string;
			is_free_license: boolean;
			price_in_cents_with_discount: number;
		}[];
	}[];
	platforms: {
		windows: boolean;
		mac: boolean;
		linux: boolean;
	};
	categories: {
		id: number;
		description: string;
	}[];
	genres: {
		id: string;
		description: string;
	}[];
	screenshots: {
		id: number;
		path_thumbnail: string;
		path_full: string;
	}[];
	movies: {
		id: number;
		name: string;
		thumbnail: string;
		dash_av1: string;
		dash_h264: string;
		hls_h264: string;
		highlight: boolean;
	}[];
	recommendations: {
		total: number;
	};
	achievements: {
		total: number;
		highlighted: {
			icon: string;
			localized_name: string;
			archived: number;
			hidden: number;
			name: string;
			path: string;
		}[];
	};
	release_date: {
		coming_soon: boolean;
		date: string;
	}; support_info: {
		url: string;
		email: string;
	};
	background: string;
	background_raw: string;
	content_descriptors: {
		ids: number[];
		notes: string;
		}; 
	ratings: Record<string, {
		rating: string;
		descriptors?: string;
		required_age?: string;
		banned?: string;
		use_age_gate?: string;
		rating_generated?: string;
	}>;
}
```