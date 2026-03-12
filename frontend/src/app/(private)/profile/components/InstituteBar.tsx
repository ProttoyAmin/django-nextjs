import { getInstituteById } from "@/src/libs/auth/actions/institute.action";
import { RootState, useAppSelector } from "@/src/redux-store";
import { UserType } from "@/types";
import React from "react";

function InstituteBar() {
  const [institute, setInstitute] = React.useState<any>(null);
  const user = useAppSelector((state: RootState) => state.user.currentUser);
  React.useEffect(() => {
    if (user?.institute_id) {
      const fetchInstitute = async () => {
        const result = await getInstituteById(user?.institute_id!.toString());
        console.log("result", result);
        if (result.success) {
          setInstitute(result.data);
        }
      };
      fetchInstitute();
    }
  }, [user?.institute_id]);
  if (!user?.institute_id) return null;
  console.log("institute", institute);
  return (
    <div className="bg-card rounded-lg shadow-md p-2">
      <p className="text-sm">{institute?.name}</p>
      institute
      <p className="text-sm">{institute?.portal}</p>
    </div>
  );
}

export default InstituteBar;
