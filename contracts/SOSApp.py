from pyteal import *

def approval_program():
    # Application arguments:
    # 0: "sos"
    # 1: hash of (timestamp, coords_rounded, user_id)
    
    on_sos = Seq([
        Assert(Txn.application_args.length() == Int(2)),
        # Just log the event as a transaction note or emit an inner transaction
        # For simplicity, we just approve it, the transaction itself serves as the log.
        # We can also store the latest SOS in global state for a dashboard.
        App.globalPut(Bytes("latest_sos_hash"), Txn.application_args[1]),
        App.globalPut(Bytes("latest_sos_sender"), Txn.sender()),
        App.globalPut(Bytes("latest_sos_time"), Global.latest_timestamp()),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(1))],
        [Txn.application_args[0] == Bytes("sos"), on_sos],
    )

    return compileTeal(program, Mode.Application, version=5)

def clear_state_program():
    return compileTeal(Return(Int(1)), Mode.Application, version=5)

if __name__ == "__main__":
    with open("sos_approval.teal", "w") as f:
        f.write(approval_program())
    with open("sos_clear.teal", "w") as f:
        f.write(clear_state_program())
