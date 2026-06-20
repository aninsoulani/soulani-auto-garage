import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest();

    // If the request is authenticated (has a valid user from JwtAuthGuard),
    // skip throttling entirely to allow unhindered Admin Dashboard operations.
    if (req.user) {
      return true;
    }

    // Otherwise, apply standard public throttling limits
    return super.handleRequest(requestProps);
  }
}
