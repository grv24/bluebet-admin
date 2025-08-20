import { useMutation } from "@tanstack/react-query";
import { changeOwnPassword } from "@/helper/user";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  cookies: any;
}

const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword, cookies }: ChangePasswordRequest) =>
      changeOwnPassword(currentPassword, newPassword, cookies),
  });
};

export default useChangePasswordMutation; 