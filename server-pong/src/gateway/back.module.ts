import { Module } from "@nestjs/common";
import { MyGateway } from "./back";

@Module({
	providers: [MyGateway],
})
export class GatewayModule { }