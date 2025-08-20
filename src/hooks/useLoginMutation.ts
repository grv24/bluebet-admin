import { useMutation } from "@tanstack/react-query";
import { loginClient, LoginRequest, LoginResponse } from "@/helper/auth";

interface LoginError {
  response?: {
    status: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

export const useLoginMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: LoginError) => void;
} = {}) => {
  return useMutation<LoginResponse, LoginError, LoginRequest>({
    mutationFn: loginClient,
    onSuccess,
    onError,
  });
};
