/**
 * A candidate's column on the ATS pipeline board. Derived from lifecycle state
 * (application status + deliverable + evaluation + winner), never stored.
 */
export enum BoardStage {
  APPLIED = 'applied',
  ACCEPTED = 'accepted',
  SUBMITTED = 'submitted',
  EVALUATED = 'evaluated',
  AWARDED = 'awarded',
  DECLINED = 'declined',
}
